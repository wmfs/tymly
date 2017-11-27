/* eslint-env mocha */

'use strict'

const HlPgClient = require('hl-pg-client')
const path = require('path')
const expect = require('chai').expect
const linkTables = require('../lib/index.js')
const initLinkTables = require('../lib/utils/init-link-table.js')
const matchPostcodeAndName = require('../lib/utils/match-postcode-and-name.js')
const generateStatementInitTable = initLinkTables.generateStatement
const processWherePartMatchNamePostcode = matchPostcodeAndName.processWherePart
const generateStatementMatchNamePostcode = matchPostcodeAndName.generateStatement

describe('Run some tests', function () {
  this.timeout(15000)
  const client = new HlPgClient(process.env.PG_CONNECTION_STRING)
  const options = {
    source: {
      schema: 'link_test',
      table: 'food',
      id: 'fhrsid',
      type: 'bigint'
    },
    target: {
      schema: 'link_test',
      table: 'addressbase',
      id: 'uprn',
      type: 'bigint'
    },
    link: {
      schema: 'link_test_results',
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

  it('Should install test schemas', () => {
    return client.runFile(path.resolve(__dirname, 'fixtures', 'scripts', 'setup.sql'))
  })

  it('Should test the statement to generate link table', (done) => {
    const statement = generateStatementInitTable(options)
    expect(statement.trim()).to.eql('CREATE SCHEMA IF NOT EXISTS link_test_results;' +
      'DROP TABLE IF EXISTS link_test_results.food_addressbase;' +
      'CREATE TABLE link_test_results.food_addressbase ' +
      '(fhrsid bigint NOT NULL PRIMARY KEY, uprn bigint,match_certainty integer);')
    done()
  })

  it('Should test the statement to match on name and postcode', (done) => {
    const statement = generateStatementMatchNamePostcode(options)
    expect(statement.trim()).to.eql('INSERT INTO link_test_results.food_addressbase (fhrsid, uprn, match_certainty) ' +
      'SELECT source.fhrsid, target.uprn, 2 FROM link_test.food source, link_test.addressbase target ' +
      'WHERE source.postcode = target.postcode AND ' +
      '(upper(business_name) = organisation_name OR ' +
      'difference(business_name, organisation_name) = 4 OR ' +
      'upper(business_name) = organisation OR ' +
      'difference(business_name, organisation) = 4 OR ' +
      'upper(business_name) = building_name OR ' +
      'difference(business_name, building_name) = 4 OR ' +
      'upper(address_line_1) = organisation_name OR ' +
      'difference(address_line_1, organisation_name) = 4 OR ' +
      'upper(address_line_1) = organisation OR ' +
      'difference(address_line_1, organisation) = 4 OR ' +
      'upper(address_line_1) = building_name OR ' +
      'difference(address_line_1, building_name) = 4) ' +
      'ON CONFLICT (fhrsid) do nothing;')
    done()
  })

  it('Should test processing the where part of a statement with both strings', (done) => {
    const where = processWherePartMatchNamePostcode(
      ['full_name'],
      ['first_name']
    )
    expect(where.trim()).to.eql('(' +
      'upper(full_name) = first_name OR ' +
      'difference(full_name, first_name) = 4)')
    done()
  })

  it('Should test processing the where part of a statement with only source array', (done) => {
    const where = processWherePartMatchNamePostcode(
      ['full_name', 'name'],
      ['first_name']
    )
    expect(where.trim()).to.eql('(' +
      'upper(full_name) = first_name OR ' +
      'difference(full_name, first_name) = 4 OR ' +
      'upper(name) = first_name OR ' +
      'difference(name, first_name) = 4)')
    done()
  })

  it('Should test processing the where part of a statement with only target array', (done) => {
    const where = processWherePartMatchNamePostcode(
      ['full_name'],
      ['first_name', 'last_name']
    )
    expect(where.trim()).to.eql('(' +
      'upper(full_name) = first_name OR ' +
      'difference(full_name, first_name) = 4 OR ' +
      'upper(full_name) = last_name OR ' +
      'difference(full_name, last_name) = 4)')
    done()
  })

  it('Should test processing the where part of a statement with both arrays', (done) => {
    const where = processWherePartMatchNamePostcode(
      ['full_name', 'name'],
      ['first_name', 'middle_name']
    )
    expect(where.trim()).to.eql('(' +
      'upper(full_name) = first_name OR ' +
      'difference(full_name, first_name) = 4 OR ' +
      'upper(full_name) = middle_name OR ' +
      'difference(full_name, middle_name) = 4 OR ' +
      'upper(name) = first_name OR ' +
      'difference(name, first_name) = 4 OR ' +
      'upper(name) = middle_name OR ' +
      'difference(name, middle_name) = 4)')
    done()
  })

  it('Should link the tables', (done) => {
    linkTables(
      options,
      client,
      (err) => {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('Should check the results', (done) => {
    client.query(
      `select fhrsid, uprn from ${options.link.schema}.${options.link.table}`,
      (err, results) => {
        expect(results.rows).to.eql([
          {fhrsid: '111111', uprn: '111'},
          {fhrsid: '987654', uprn: '987'},
          {fhrsid: '444444', uprn: '444'},
          {fhrsid: '555555', uprn: '555'},
          {fhrsid: '666666', uprn: '666'}
        ])
        done(err)
      }
    )
  })

  it('Should uninstall test schemas', () => {
    return client.runFile(path.resolve(__dirname, 'fixtures', 'scripts', 'cleanup.sql'))
  })
})
