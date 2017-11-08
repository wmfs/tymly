/* eslint-env mocha */

'use strict'

const PGClient = require('pg-client-helper')
const chai = require('chai')
const expect = chai.expect
const path = require('path')
const generateDelta = require('./../lib')

describe('Run the basic usage example',
  function () {
    this.timeout(10000)

    const client = new PGClient(process.env.PG_CONNECTION_STRING)

    it('Should install test schemas', () => {
      return client.runFile(path.resolve(__dirname, 'fixtures', 'install-test-schemas.sql'))
    })

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

    it('Should uninstall test schemas', () => {
      return client.runFile(path.resolve(__dirname, 'fixtures', 'uninstall-test-schemas.sql'))
    })
  }
)
