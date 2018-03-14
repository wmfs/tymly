/* eslint-env mocha */

'use strict'

const HlPgClient = require('hl-pg-client')
const chai = require('chai')
const expect = chai.expect
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const multicopy = require('../lib/components/state-resources/importing-csv-files/multicopy.js')
const process = require('process')

describe('Multicopy tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let connectionString = process.env.PG_CONNECTION_STRING
  let client = new HlPgClient(connectionString)

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('setup DB env', function (done) {
    sqlScriptRunner(
      ['./setup.sql'],
      client,
      err => done(err)
    )
  })

  it('make a call to the multicopy and check data is entered', async () => {
    await multicopy(
      'test/fixtures/multicopy-data',
      client
    )
  })

  it('check data in the tables are as they be', async () => {
    const expected = [
      { id: '1', info: 'first' },
      { id: '2', info: 'second' },
      { id: '3', info: 'third' },
      { id: '4', info: 'fourth' }
    ]

    const result = await client.query('select * from refresh_test.btest')
    expect(result.rows).to.eql(expected)
  })

  it('cleanup the test data', function (done) {
    sqlScriptRunner(
      ['./cleanup.sql'],
      client,
      err => done(err)
    )
  })

  it('close database connections', function (done) {
    client.end()
    done()
  })
})
