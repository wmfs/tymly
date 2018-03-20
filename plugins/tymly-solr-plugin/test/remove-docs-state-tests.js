/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const process = require('process')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const STATE_MACHINE_NAME = 'tymlyTest_removeDocs_1_0'

describe('tymly-solr-plugin remove docs resource tests', function () {
  this.timeout(process.env.TIMEOUT || 6000)

  let tymlyService, statebox, client

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('should run the tymly services', (done) => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/incident-blueprint')
        ]
      },
      (err, tymlyServices) => {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        done()
      }
    )
  })

  if (process.env.SOLR_URL &&
    process.env.SOLR_PATH &&
    process.env.SOLR_PORT &&
    process.env.SOLR_HOST) {
    it('should create test resources', (done) => {
      sqlScriptRunner(
        './db-scripts/incident-setup.sql',
        client,
        (err) => {
          expect(err).to.equal(null)
          done(err)
        }
      )
    })

    it('perform reindex', (done) => {
      statebox.startExecution(
        {},
        'tymlyTest_fullReindex_1_0',
        {
          sendResponse: 'COMPLETE'
        },
        (err, executionDescription) => {
          expect(err).to.eql(null)
          console.log(JSON.stringify(executionDescription, null, 2))
          done(err)
        }
      )
    })

    it('should wait a while', (done) => {
      setTimeout(done, 4900)
    })

    it('should search to check data is there', (done) => {
      statebox.startExecution(
        {},
        'tymly_search_1_0',
        {
          sendResponse: 'COMPLETE'
        },
        (err, executionDescription) => {
          expect(err).to.eql(null)
          expect(executionDescription.ctx.searchResults.results.length).to.eql(3)
          done(err)
        }
      )
    })

    it('should execution remove docs state machine', (done) => {
      statebox.startExecution(
        {},
        STATE_MACHINE_NAME,
        {
          sendResponse: 'COMPLETE'
        },
        (err, executionDescription) => {
          expect(err).to.eql(null)
          console.log(JSON.stringify(executionDescription, null, 2))
          expect(executionDescription.currentStateName).to.eql('RemoveDocs')
          expect(executionDescription.currentResource).to.eql('module:removeDocs')
          expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          done(err)
        }
      )
    })

    it('should search to check data is removed', (done) => {
      statebox.startExecution(
        {},
        'tymly_search_1_0',
        {
          sendResponse: 'COMPLETE'
        },
        (err, executionDescription) => {
          expect(err).to.eql(null)
          expect(executionDescription.ctx.searchResults.results.length).to.eql(0)
          done(err)
        }
      )
    })
  }

  it('should cleanup test resources', (done) => {
    sqlScriptRunner(
      './db-scripts/cleanup.sql',
      client,
      (err) => {
        expect(err).to.equal(null)
        done(err)
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
