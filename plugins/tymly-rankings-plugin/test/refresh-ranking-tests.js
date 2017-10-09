/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const tymly = require('tymly')
const path = require('path')
const STATE_MACHINE_NAME = 'test_refreshRanking_1_0'

describe('Tests the Ranking State Resource', function () {
  this.timeout(5000)
  let statebox
  it('should run the tymly service', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './..')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprint')
        ],
        config: {}

      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        done()
      }
    )
  })
  it('should start the state resource execution', function (done) {
    statebox.startExecution(
      {},  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('RefreshRanking')
        expect(executionDescription.currentResource).to.eql('module:refreshRanking')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })
})
