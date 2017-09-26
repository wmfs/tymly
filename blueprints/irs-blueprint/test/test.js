/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect
const STATE_MACHINE_NAME = 'wmfs_incidentEditor_1_0'

describe('data import', function () {
  this.timeout(5000)
  let statebox
  let executionName

  it('should startup flobot', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          require.resolve('flobot-forms-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        statebox = flobotServices.statebox

        done()
      }
    )
  })

  it('should start a form-filling execution', function (done) {
    statebox.startExecution(
      {},  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:formFilling'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        executionName = executionDescription.executionName
        expect(executionDescription.status).to.eql('RUNNING')
        expect(executionDescription.currentStateName).to.eql('FormFilling')
        done()
      }
    )
  })

  /*
  * TODO:
  * To pass in full on safe and well document
  * */
  it('should sendTaskSuccess (i.e. some form data)', function (done) {
    statebox.sendTaskSuccess(
      executionName,
      {
        formData: {
          name: 'Rupert',
          email: 'rupert@flobotjs.io'
        }
      }, // output
      {}, // executionOptions
      function (err) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should successfully complete upsert execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.currentStateName).to.eql('Upserting')
        done()
      }
    )
  })
})
