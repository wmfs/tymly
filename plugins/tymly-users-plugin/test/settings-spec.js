/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const PGClient = require('pg-client-helper')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_SETTINGS_STATE_MACHINE = 'tymly_getSettings_1_0'
const APPLY_SETTINGS_STATE_MACHINE = 'tymly_applySettings_1_0'

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

  it('should get test-user\'s settings', function (done) {
    statebox.startExecution(
      {},
      GET_SETTINGS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('GetSettings')
        expect(executionDescription.currentResource).to.eql('module:getSettings')
        expect(executionDescription.stateMachineName).to.eql(GET_SETTINGS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.results[0].userId).to.eql('test-user')
        done()
      }
    )
  })

  it('should update test-user\'s settings', function (done) {
    statebox.startExecution(
      {
        categoryRelevance: '["incidents", "hr", "hydrants", "gazetteer", "expenses"]'
      },
      APPLY_SETTINGS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('ApplySettings')
        expect(executionDescription.currentResource).to.eql('module:applySettings')
        expect(executionDescription.stateMachineName).to.eql(APPLY_SETTINGS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should ensure test-user\'s applied settings are present in DB', function (done) {
    statebox.startExecution(
      {},
      GET_SETTINGS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('GetSettings')
        expect(executionDescription.currentResource).to.eql('module:getSettings')
        expect(executionDescription.stateMachineName).to.eql(GET_SETTINGS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.results[0].userId).to.eql('test-user')
        expect(executionDescription.ctx.results[0].categoryRelevance).to.eql(
          [ 'incidents', 'hr', 'hydrants', 'gazetteer', 'expenses' ]
        )
        done()
      }
    )
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./db-scripts/settings/cleanup.sql', client)
  })
})
