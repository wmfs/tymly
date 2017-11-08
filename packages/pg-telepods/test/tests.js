/* eslint-env mocha */

'use strict'

const PGClient = require('pg-client-helper')
const startTelepods = require('./../lib')
const process = require('process')
const chai = require('chai')
const expect = chai.expect
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const path = require('path')
const fs = require('fs')

describe('Run the basic-usage example',
  function () {
    this.timeout(15000)
    let client

    it('Should create a new pg client', () => {
      client = new PGClient(process.env.PG_CONNECTION_STRING)
    })

    it('Should install test schemas', () => {
      return sqlScriptRunner('install-test-schemas.sql', client)
    })

    it('Should start the telepods', async () => {
      const result = await startTelepods({
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
      })
      expect(result).to.not.equal(null)
    })

    it('Should return correctly modified children rows', async () => {
      const result = await client.query(
        'select social_security_id, origin_hash_sum, name, town from government.census order by social_security_id'
      )
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
      expect(result).to.not.equal(null)
    })

    it('Should check for deletes csv', () => {
      const censusDeletes = path.resolve(__dirname, './output/deletes/census.csv')
      expect(fs.existsSync(censusDeletes)).to.equal(true)
    })

    it('Should uninstall test schemas', () => {
      return sqlScriptRunner('uninstall-test-schemas.sql', client)
    })
  }
)
