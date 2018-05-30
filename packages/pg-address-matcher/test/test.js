/* eslint-env mocha */

'use strict'

const HlPgClient = require('hl-pg-client')
const path = require('path')
const expect = require('chai').expect
const matchTables = require('../lib/index.js')
const initMatchTables = require('../lib/utils/init-match-table.js')
const matchPostcodeAndName = require('../lib/utils/match-postcode-and-name.js')
const generateStatementInitTable = initMatchTables.generateStatement
const processWhere = matchPostcodeAndName.processWhere
const process = require('process')

describe('Run some tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const options = {
    source: {
      schema: 'match_test',
      table: 'food',
      id: 'food_id',
      type: 'bigint'
    },
    target: {
      schema: 'match_test',
      table: 'addressbase',
      id: 'address_id',
      type: 'bigint'
    },
    match: {
      schema: 'match_test_results',
      table: 'food_addressbase',
      map: {
        postcode: {
          source: 'postcode',
          target: 'postcode'
        },
        businessName: {
          source: ['business_name', 'address_line_1'],
          target: ['organisation_name', 'organisation', 'building_name']
        }
      }
    }
  }
  let client

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('Should setup database connection', (done) => {
    client = new HlPgClient(process.env.PG_CONNECTION_STRING)
    done()
  })

  it('Should install test schemas', () => {
    return client.runFile(path.resolve(__dirname, 'fixtures', 'scripts', 'setup.sql'))
  })

  it('Should test the statement to generate match table', (done) => {
    const statement = generateStatementInitTable(options)
    expect(statement.trim()).to.eql('CREATE SCHEMA IF NOT EXISTS match_test_results; ' +
      'DROP TABLE IF EXISTS match_test_results.food_addressbase; ' +
      'CREATE TABLE match_test_results.food_addressbase ' +
      '(food_id bigint NOT NULL PRIMARY KEY, address_id bigint, match_certainty integer);')
    done()
  })

  it('Should test processing the where part of a statement with both strings', (done) => {
    const where = processWhere(
      'exact',
      ['full_name'],
      ['first_name']
    )
    expect(where.trim()).to.eql('(' +
      'upper(full_name) = upper(first_name))')
    done()
  })

  it('Should test processing the where part of a statement with only source array', (done) => {
    const where = processWhere(
      'exact',
      ['full_name', 'name'],
      ['first_name']
    )
    expect(where.trim()).to.eql('(' +
      'upper(full_name) = upper(first_name) OR ' +
      'upper(name) = upper(first_name))')
    done()
  })

  it('Should test processing the where part of a statement with only target array', (done) => {
    const where = processWhere(
      'exact',
      ['full_name'],
      ['first_name', 'last_name']
    )
    expect(where.trim()).to.eql('(' +
      'upper(full_name) = upper(first_name) OR ' +
      'upper(full_name) = upper(last_name))')
    done()
  })

  it('Should test processing the where part of a statement with both arrays', (done) => {
    const where = processWhere(
      'exact',
      ['full_name', 'name'],
      ['first_name', 'middle_name']
    )
    expect(where.trim()).to.eql('(' +
      'upper(full_name) = upper(first_name) OR ' +
      'upper(full_name) = upper(middle_name) OR ' +
      'upper(name) = upper(first_name) OR ' +
      'upper(name) = upper(middle_name))')
    done()
  })

  it('Should test processing the where part of a statement with only source array', (done) => {
    const where = processWhere(
      'fuzzy',
      ['full_name', 'name'],
      ['first_name']
    )
    expect(where.trim()).to.eql('(' +
      'difference(full_name, first_name) = 4 OR ' +
      'difference(name, first_name) = 4)')
    done()
  })

  it('Should test processing the where part of a statement with only target array', (done) => {
    const where = processWhere(
      'fuzzy',
      ['full_name'],
      ['first_name', 'last_name']
    )
    expect(where.trim()).to.eql('(' +
      'difference(full_name, first_name) = 4 OR ' +
      'difference(full_name, last_name) = 4)')
    done()
  })

  it('Should test processing the where part of a statement with both arrays', (done) => {
    const where = processWhere(
      'fuzzy',
      ['full_name', 'name'],
      ['first_name', 'middle_name']
    )
    expect(where.trim()).to.eql('(' +
      'difference(full_name, first_name) = 4 OR ' +
      'difference(full_name, middle_name) = 4 OR ' +
      'difference(name, first_name) = 4 OR ' +
      'difference(name, middle_name) = 4)')
    done()
  })

  it('Should match the tables', async () => {
    await matchTables(options, client)
  })

  it('Should check the results', async () => {
    const results = await client.query(`select food_id, address_id from ${options.match.schema}.${options.match.table} where match_certainty != 0`)
    expect(results.rows).to.eql([
      {food_id: '111111', address_id: '111'},
      {food_id: '987654', address_id: '987'},
      {food_id: '444444', address_id: '444'},
      {food_id: '555555', address_id: '555'},
      {food_id: '666666', address_id: '666'},
      {food_id: '777777', address_id: '777'},
      {food_id: '888888', address_id: '888'}
    ])
  })

  it('Should check the results', async () => {
    const results = await client.query(`select food_id, address_id from ${options.match.schema}.${options.match.table} where match_certainty = 0`)
    expect(results.rows).to.eql([
      {food_id: '222222', address_id: null},
      {food_id: '333333', address_id: null}
    ])
  })

  it('Should uninstall test schemas', () => {
    return client.runFile(path.resolve(__dirname, 'fixtures', 'scripts', 'cleanup.sql'))
  })

  it('Should close database connections', function (done) {
    client.end()
    done()
  })
})
