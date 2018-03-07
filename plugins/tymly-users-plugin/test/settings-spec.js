/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const process = require('process')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_SETTINGS_STATE_MACHINE = 'tymly_getSettings_1_0'
const APPLY_SETTINGS_STATE_MACHINE = 'tymly_applySettings_1_0'

describe('settings tymly-users-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox, tymlyService, client
  const fakeCategories = { }

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        tymlyServices.categories.categories_ = fakeCategories
        tymlyService = tymlyServices.tymly
        client = tymlyServices.storage.client
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
        try {
          expect(err).to.eql(null)
          expect(executionDescription.currentStateName).to.eql('GetSettings')
          expect(executionDescription.currentResource).to.eql('module:getSettings')
          expect(executionDescription.stateMachineName).to.eql(GET_SETTINGS_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.ctx.userSettings.userId).to.eql('test-user')
          expect(executionDescription.ctx.userSettings.categoryRelevance.length).to.eql(5)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('gazetteer')).to.eql(true)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('hr')).to.eql(true)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('hydrants')).to.eql(true)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('incidents')).to.eql(true)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('expenses')).to.eql(true)
          done()
        } catch (err) {
          done(err)
        }
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
        try {
          expect(err).to.eql(null)
          expect(executionDescription.currentStateName).to.eql('ApplySettings')
          expect(executionDescription.currentResource).to.eql('module:applySettings')
          expect(executionDescription.stateMachineName).to.eql(APPLY_SETTINGS_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          done()
        } catch (err) {
          done(err)
        }
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
        try {
          expect(err).to.eql(null)
          expect(executionDescription.currentStateName).to.eql('GetSettings')
          expect(executionDescription.currentResource).to.eql('module:getSettings')
          expect(executionDescription.stateMachineName).to.eql(GET_SETTINGS_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.ctx.userSettings.userId).to.eql('test-user')
          expect(executionDescription.ctx.userSettings.categoryRelevance.length).to.eql(5)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('incidents')).to.eql(true)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('hr')).to.eql(true)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('hydrants')).to.eql(true)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('gazetteer')).to.eql(true)
          expect(executionDescription.ctx.userSettings.categoryRelevance.includes('expenses')).to.eql(true)
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('get default values for new-user\'s settings', function (done) {
    statebox.startExecution(
      {},
      GET_SETTINGS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'new-user'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          expect(executionDescription.currentStateName).to.eql('GetSettings')
          expect(executionDescription.currentResource).to.eql('module:getSettings')
          expect(executionDescription.stateMachineName).to.eql(GET_SETTINGS_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.ctx.userSettings.userId).to.eql('new-user')
          expect(executionDescription.ctx.userSettings.categoryRelevance).to.eql([])
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })

  it('should shut down Tymly nicely', async () => {
    await tymlyService.shutdown()
  })
})
