/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

const GET_WATCHED_BOARDS_STATE_MACHINE = 'tymlyUsersTest_getWatchedBoards_1_0'

describe('tymly-users-plugin tests', function () {
  this.timeout(5000)
  let statebox

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/test-blueprint')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should start the state machine to get watched boards', function (done) {
    statebox.startExecution(
      {},
      GET_WATCHED_BOARDS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetWatchedBoards')
        expect(executionDescription.currentResource).to.eql('module:getWatchedBoards')
        expect(executionDescription.stateMachineName).to.eql(GET_WATCHED_BOARDS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })
})
