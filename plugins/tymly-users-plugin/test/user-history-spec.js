/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const process = require('process')

const GET_USER_HISTORY_STATE_MACHINE = 'tymly_getUserHistory_1_0'

describe('user history tymly-users-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox, tymlyService

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

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
        tymlyService = tymlyServices.tymly
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

  it('should shut down Tymly nicely', async () => {
    await tymlyService.shutdown()
  })
})
