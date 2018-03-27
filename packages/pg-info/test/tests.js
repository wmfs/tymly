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
  const fixtureDir = path.resolve(__dirname, 'fixtures')
  const expectedSchemas = require(path.resolve(fixtureDir, 'expected-schema.json'))
  let client

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  describe('setup', () => {
    it('Should create a new pg client', () => {
      const pgConnectionString = process.env.PG_CONNECTION_STRING
      client = new HlPgClient(pgConnectionString)
    })

    it('Should install test schemas', () => {
      return client.runFile(path.resolve(fixtureDir, 'install-test-schemas.sql'))
    })
  }) // setup

  describe('interrogate db', () => {
    it('get database info (callback)', function (done) {
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

    it('get database info (promise)', async () => {
      const info = await pgInfo({
        client: client,
        schemas: schemaNames
      })

      expect(info).to.containSubset({
        schemas: expectedSchemas
      })
    })
  })

  describe('cleanup', () => {
    it('uninstall test schemas', () => {
      return client.runFile(path.resolve(fixtureDir, 'uninstall-test-schemas.sql'))
    })

    it('close database connections', () => {
      client.end()
    })
  })
})
