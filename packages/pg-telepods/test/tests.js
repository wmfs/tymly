/* eslint-env mocha */

'use strict'

const pg = require('pg')
const startTelepods = require('./../lib')
const process = require('process')
const chai = require('chai')
const expect = chai.expect
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const path = require('path')
const fs = require('fs')
let client

// Make a Postgres client

describe('Run the basic-usage example',
  function () {
    this.timeout(15000)

    it('Should create a new pg client',
      function () {
        client = new pg.Client(process.env.PG_CONNECTION_STRING)
        client.connect()
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
    it('Should start the telepods',
      function (done) {
        startTelepods(
          {
            client: client,
            outputDir: path.resolve(__dirname, './output'),
            source: {
              tableName: 'springfield.people',
              hashSumColumnName: 'hash_sum'
            },
            target: {
              tableName: 'government.census',
              hashSumColumnName: 'origin_hash_sum'
            },
            join: {
              'social_security_id': 'social_security_id' // key = source table column, value = target table column
            },
            transformFunction: function (sourceRow, callback) {
              callback(null, {
                'socialSecurityId': sourceRow.socialSecurityId,
                'name': sourceRow.firstName + ' ' + sourceRow.lastName,
                'town': 'Springfield'
              })
            }
          },
          function (err, stats) {
            expect(err).to.eql(null)
            done()
          }
        )
      }
    )

    it('Should return correctly modified children rows', function (done) {
      client.query(
        'select social_security_id, origin_hash_sum, name, town from government.census order by social_security_id',
        function (err, result) {
          expect(err).to.equal(null)
          expect(result.rows).to.eql(
            [
              {
                'name': 'Homer Simpson',
                'origin_hash_sum': 'AAAAAAAA',
                'social_security_id': 1,
                'town': 'Springfield'
              },
              {
                'name': 'Marge Simpson',
                'origin_hash_sum': 'BBBBBBBB',
                'social_security_id': 2,
                'town': 'Springfield'
              },
              {
                'name': 'Montgomery Burns',
                'origin_hash_sum': 'EEEEEEEE',
                'social_security_id': 5,
                'town': 'Springfield'
              },
              {
                'name': 'Ned Flanders',
                'origin_hash_sum': '11111111',
                'social_security_id': 6,
                'town': 'Springfield'
              }
            ]
          )
          done()
        }
      )
    })

    it('Should check for deletes csv',
      function (done) {
        expect(fs.existsSync('packages/pg-telepods/test/output/deletes/census.csv')).to.equal(true)
        done()
      })

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

    it('Should end db client',
      function () {
        client.end()
      }
    )
  }
)
