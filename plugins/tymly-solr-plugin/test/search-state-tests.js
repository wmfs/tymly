/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const STATE_MACHINE_NAME = 'tymlyTest_search_1_0'

describe('tymly-solr-plugin search state resource tests', function () {
  this.timeout(5000)

  let statebox
  let client

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
            'characterName'
          ]
        }
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
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

  it('should search with no input (everything)', function (done) {
    statebox.startExecution(
      {},  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('Search')
        expect(executionDescription.currentResource).to.eql('module:search')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.searchResults.totalHits).to.eql(19)
        expect(executionDescription.ctx.searchResults.results[0].character_name).to.eql('GINNY WEASLEY')
        expect(executionDescription.ctx.searchResults.results[1].character_name).to.eql('HERMIONE GRANGER')
        expect(executionDescription.ctx.searchResults.results[2].character_name).to.eql('ALBUS DUMBLEDORE')
        done()
      }
    )
  })

  it('should search with a query input', function (done) {
    statebox.startExecution(
      {
        query: 'Hermione'
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
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
})
