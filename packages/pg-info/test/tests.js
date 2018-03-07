/* eslint-env mocha */

'use strict'

const HlPgClient = require('hl-pg-client')
const process = require('process')
const path = require('path')
const pgInfo = require('./../lib')
const chai = require('chai')
const chaiSubset = require('chai-subset')
chai.use(chaiSubset)
const expect = chai.expect

describe('Run the basic-usage example', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const schemaNames = ['pginfo_people_test', 'pginfo_planets_test', 'pginfo_not_exists']
  const expectedSchemas = require(path.resolve(__dirname, 'fixtures', 'expected-schema.json'))
  let client

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('Should create a new pg client', () => {
    const pgConnectionString = process.env.PG_CONNECTION_STRING
    client = new HlPgClient(pgConnectionString)
  })

  it('Should install test schemas', () => {
    return client.runFile(path.resolve(__dirname, 'fixtures', 'install-test-schemas.sql'))
  })

  it('Should get some database info (callback)', function (done) {
    pgInfo(
      {
        client: client,
        schemas: schemaNames
      },
      function (err, info) {
        expect(err).to.equal(null)
        expect(info).to.containSubset(
          {
            schemas: expectedSchemas
          }
        )
        done()
      }
    )
  })

  it('Should get some database info (promise)', function () {
    pgInfo(
      {
        client: client,
        schemas: schemaNames
      })
      .then(info =>
        expect(info).to.containSubset(
          {
            schemas: expectedSchemas
          }
        )
      ) // pgInfo
  })

  it('Should uninstall test schemas', () => {
    return client.runFile(path.resolve(__dirname, 'fixtures', 'uninstall-test-schemas.sql'))
  })

  it('Should close database connections', function (done) {
    client.end()
    done()
  })
})
