/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const PGClient = require('pg-client-helper')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_SETTINGS_STATE_MACHINE = 'tymly_getSettings_1_0'

describe('settings tymly-users-plugin tests', function () {
  this.timeout(5000)
  let statebox

  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new PGClient(pgConnectionString)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/test-blueprint')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should create the test resources', function () {
    return sqlScriptRunner('./db-scripts/settings/setup.sql', client)
  })

  it('should get user2s settings', function (done) {
    statebox.startExecution(
      {},
      GET_SETTINGS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log('***', executionDescription.ctx.results)
        expect(executionDescription.currentStateName).to.eql('GetSettings')
        expect(executionDescription.currentResource).to.eql('module:getSettings')
        expect(executionDescription.stateMachineName).to.eql(GET_SETTINGS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.results[0].userId).to.eql('test-user')

        done()
      }
    )
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./db-scripts/settings/cleanup.sql', client)
  })
})
