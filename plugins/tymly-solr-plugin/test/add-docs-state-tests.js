/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')
const STATE_MACHINE_NAME = 'tymlyTest_addDocs_1_0'

describe('tymly-solr-plugin add docs resource tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let statebox
  let client
  let numHits

  it('should run the tymly services', function (done) {
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
      function (err, tymlyServices) {
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
    it('should create test resources', function (done) {
      sqlScriptRunner(
        './db-scripts/incident-setup.sql',
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

    it('should ensure the record to be inserted isnt already there', done => {
      statebox.startExecution(
        {},
        'tymlyTest_search_1_0',
        {
          sendResponse: 'COMPLETE'
        },
        function (err, executionDescription) {
          expect(err).to.eql(null)
          console.log(executionDescription)
          numHits = executionDescription.ctx.searchResults.totalHits
          console.log(executionDescription.ctx)
          done(err)
        }
      )
    })

    it('should get a record and try to add it', function (done) {
      statebox.startExecution(
        {
          id: 1
        },  // input
        STATE_MACHINE_NAME, // state machine name
        {
          sendResponse: 'COMPLETE'
        }, // options
        function (err, executionDescription) {
          expect(err).to.eql(null)
          // console.log(executionDescription)
          expect(executionDescription.currentStateName).to.eql('AddDocs')
          expect(executionDescription.currentResource).to.eql('module:addDocs')
          expect(executionDescription.status).to.eql('SUCCEEDED')
          done()
        }
      )
    })

    it('should ensure the record was added', done => {
      statebox.startExecution(
        {},
        'tymlyTest_search_1_0',
        {
          sendResponse: 'COMPLETE'
        },
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.ctx.searchResults.totalHits).to.eql(numHits + 1)
          console.log(executionDescription.ctx)
          done(err)
        }
      )
    })

    it('should remove the test doc', done => {
      statebox.startExecution(
        {},
        'tymlyTest_removeDocs_1_0',
        {
          sendResponse: 'COMPLETE'
        },
        function (err, executionDescription) {
          expect(err).to.eql(null)
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
  }

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
