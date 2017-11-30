/* eslint-env mocha */

'use strict'

const HlPgClient = require('hl-pg-client')
const chai = require('chai')
const expect = chai.expect
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const main = require('../lib/components/state-resources/importing-csv-files/multicopy.js')
const refresh = main.refresh

describe('Initializing environment...', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let connectionString = process.env.PG_CONNECTION_STRING
  let client = new HlPgClient(connectionString)

  it('Should setup DB env', function (done) {
    sqlScriptRunner(
      ['./setup.sql'],
      client,
      function (err) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          done()
        }
      }
    )
  })

  it('Should make a call to the refresh and check data is entered', function (done) {
    refresh(
      'test/fixtures/multicopy-data',
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('Should check data in the tables are as they should be', function (done) {
    client.query(
      'select * from refresh_test.btest',
      function (err, result) {
        expect(err).to.eql(null)

        console.log(result.rows)

        expect(result.rows[0].id).to.eql('1')
        expect(result.rows[0].info).to.eql('first')

        expect(result.rows[1].id).to.eql('2')
        expect(result.rows[1].info).to.eql('second')

        expect(result.rows[2].id).to.eql('3')
        expect(result.rows[2].info).to.eql('third')

        expect(result.rows[3].id).to.eql('4')
        expect(result.rows[3].info).to.eql('fourth')

        done()
      }
    )
  })

  it('Should cleanup the test data', function (done) {
    sqlScriptRunner(
      ['./cleanup.sql'],
      client,
      function (err) {
        expect(err).to.equal(null)
        if (err) console.log('ERR: ', err)
        done()
      }
    )
  })
})
