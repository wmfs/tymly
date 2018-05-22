/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const process = require('process')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const STATE_MACHINE_NAME = 'tymlyTest_search_1_0'

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

describe('tymly-solr-plugin search state resource tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, statebox, client, rbac

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('should run the tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/school-blueprint')
        ],
        config: {
          solrSchemaFields: [
            'id',
            'actorName',
            'characterName',
            'roles'
          ]
        }
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        rbac = tymlyServices.rbac
        client = tymlyServices.storage.client
        done()
      }
    )
  })

  it('should create test resources', function (done) {
    sqlScriptRunner(
      './db-scripts/setup.sql',
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

  it('should ensure John Smith is the boss and a minor', () => {
    return rbac.ensureUserRoles(
      'john.smith',
      ['tymlyTest_boss', 'tymlyTest_minor']
    )
  })

  it('should ensure Jane Smith is a minor', () => {
    return rbac.ensureUserRoles(
      'jane.smith',
      ['tymlyTest_minor']
    )
  })

  it('should search with no input (everything) as a user with the highest roles', function (done) {
    statebox.startExecution(
      {}, // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE',
        userId: 'john.smith'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('Search')
        expect(executionDescription.currentResource).to.eql('module:search')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.searchResults.totalHits).to.eql(19)
        expect(executionDescription.ctx.searchResults.results[0].character_name).to.eql('RUBEUS HAGRID')
        expect(executionDescription.ctx.searchResults.results[1].character_name).to.eql('SEVERUS SNAPE')
        expect(executionDescription.ctx.searchResults.results[2].character_name).to.eql('GEORGE WEASLEY')
        done()
      }
    )
  })

  it('should search with a query input as a user with the highest roles', function (done) {
    statebox.startExecution(
      {
        query: 'Hermione'
      }, // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE',
        userId: 'john.smith'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('Search')
        expect(executionDescription.currentResource).to.eql('module:search')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.searchResults.totalHits).to.eql(1)
        expect(executionDescription.ctx.searchResults.results[0].character_name).to.eql('HERMIONE GRANGER')
        done()
      }
    )
  })

  it('should search with a query input as a user without any roles', function (done) {
    statebox.startExecution(
      {}, // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE',
        userId: 'jim.smith'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.ctx.searchResults.totalHits).to.eql(0)
        expect(executionDescription.ctx.searchResults.results.length).to.eql(0)
        done()
      }
    )
  })

  it('should fail to search when user role is a minor', function (done) {
    statebox.startExecution(
      {}, // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE',
        userId: 'jane.smith'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.ctx.searchResults.totalHits).to.eql(0)
        expect(executionDescription.ctx.searchResults.results.length).to.eql(0)
        done()
      }
    )
  })

  it('should fail to search with no user id', function (done) {
    statebox.startExecution(
      {}, // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('FAILED')
        expect(executionDescription.errorCode).to.eql('noUserIdSearchFail')
        expect(executionDescription.errorMessage).to.eql('No user ID found when trying to search.')
        done()
      }
    )
  })

  it('should cleanup test resources', function (done) {
    sqlScriptRunner(
      './db-scripts/cleanup.sql',
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

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
