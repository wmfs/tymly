/* eslint-env mocha */

'use strict'

const HlPgClient = require('hl-pg-client')
const chai = require('chai')
const expect = chai.expect
const path = require('path')
const generateDelta = require('../lib')
const process = require('process')

describe('Run the basic usage example', function () {
  this.timeout(process.env.TIMEOUT || 5000)

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
    return client.runFile(path.resolve(__dirname, 'fixtures', 'install-test-schemas.sql'))
  })

  it('Should generate the delta file', function (done) {
    generateDelta(
      {
        namespace: 'springfield',
        client: client,
        since: '2016-06-03 15:02:38.000000 GMT',
        outputFilepath: path.resolve(__dirname, './output', './single-delta.csv'),
        actionAliases: {
          insert: 'i',
          update: 'u',
          delete: 'd'
        },
        csvExtracts: {
          people: [
            73,
            '$ACTION',
            '$ROW_NUM',
            '@social_security_id',
            '@first_name',
            '@last_name',
            '@age'
          ]
        }
      },
      function (err) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should generate delta file for both tables', function (done) {
    generateDelta(
      {
        namespace: 'springfield', // to be inferred
        client: client,
        since: '2017-06-02 15:02:38.000000 GMT',
        outputFilepath: path.resolve(__dirname, './output', './multiple-delta.csv'),
        actionAliases: {
          insert: 'i',
          update: 'u',
          delete: 'd'
        },
        csvExtracts: {
          homes: [
            74,
            '$ACTION',
            '@address',
            '@owner_id'
          ],
          people: [
            73,
            '$ACTION',
            '@social_security_id',
            '@first_name',
            '@last_name',
            '@age'
          ]
        }
      },
      function (err) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('Should uninstall test schemas', () => {
    return client.runFile(path.resolve(__dirname, 'fixtures', 'uninstall-test-schemas.sql'))
  })

  it('Should close database connections', function (done) {
    client.end()
    done()
  })
})
