/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const HlPgClient = require('hl-pg-client')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const RESUME_FORM_STATE_MACHINE = 'tymly_resumeForm_1_0'

describe('form state tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox

  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './../test/fixtures/tymly-blueprint')
        ],
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        done(err)
      }
    )
  })

  it('should create the test resources', function () {
    return sqlScriptRunner('./db-scripts/forms/setup.sql', client)
  })

  it('should execute resume form', function (done) {
    statebox.startExecution(
      {
        formId: 'b34e86d4-d5b1-11e7-9296-cec278b6b50a',
        model: 'expenses'
      },
      RESUME_FORM_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('ResumeForm')
        expect(executionDescription.currentResource).to.eql('module:resumeForm')
        expect(executionDescription.stateMachineName).to.eql(RESUME_FORM_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.form.firstName).to.eql('test1')
        done(err)
      }
    )
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })
})
