/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

const GET_USER_HISTORY_STATE_MACHINE = 'tymly_getUserHistory_1_0'

describe('user history tymly-users-plugin tests', function () {
  this.timeout(5000)
  let statebox

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

  it('should start the state machine to get user history', function (done) {
    statebox.startExecution(
      {},
      GET_USER_HISTORY_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        // console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetUserHistory')
        expect(executionDescription.currentResource).to.eql('module:getUserHistory')
        expect(executionDescription.stateMachineName).to.eql(GET_USER_HISTORY_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })
})
