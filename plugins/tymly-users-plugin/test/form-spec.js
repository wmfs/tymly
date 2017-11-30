/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

const RESUME_FORM_STATE_MACHINE = 'tymly_resumeForm_1_0'

describe('form state tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox

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
        done(err)
      }
    )
  })

  it('should execute resume form', function (done) {
    statebox.startExecution(
      {},
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
        done(err)
      }
    )
  })
})
