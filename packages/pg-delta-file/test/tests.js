/* eslint-env mocha */

'use strict'

const PGClient = require('pg-client-helper')
const chai = require('chai')
const expect = chai.expect
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const generateDelta = require('./../lib')

let client

describe('Run the basic usage example',
  function () {
    this.timeout(15000)

    it('Should create a new pg client',
      function () {
        client = new PGClient(process.env.PG_CONNECTION_STRING)
      }
    )

    it('Should install test schemas',
      function (done) {
        sqlScriptRunner(
          'install-test-schemas.sql',
          client,
          function (err) {
            expect(err).to.equal(null)
            done()
          }
        )
      }
    )

    it('Should generate the delta file',
      function (done) {
        generateDelta(
          {
            'client': client,
            'since': '2017-06-02 15:02:38.000000 GMT',
            'outputFilepath': path.resolve(__dirname, './output', './delta.csv'),
            'createdColumnName': '_created',
            'modifiedColumnName': '_modified',
            'tables': [
              {
                'tableName': 'springfield.people',
                'csvColumns': [
                  73,
                  'D',
                  '$ROW_NUM',
                  '@social_security_id',
                  '@first_name',
                  '@last_name',
                  '@age'
                ]
              }
            ]
          },
          function (err) {
            expect(err).to.eql(null)
            done()
          }
        )
      }
    )

    it('Should uninstall test schemas',
      function (done) {
        sqlScriptRunner(
          'uninstall-test-schemas.sql',
          client,
          function (err) {
            expect(err).to.equal(null)
            done()
          }
        )
      }
    )
  }
)
