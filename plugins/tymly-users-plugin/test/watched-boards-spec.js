/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const HlPgClient = require('hl-pg-client')

const GET_WATCHED_BOARDS_STATE_MACHINE = 'tymly_getWatchedBoards_1_0'
const WATCH_BOARD_STATE_MACHINE = 'tymly_watchBoard_1_0'
const UNWATCH_BOARD_STATE_MACHINE = 'tymly_unwatchBoard_1_0'

describe('watched-boards tymly-users-plugin tests', function () {
  this.timeout(5000)
  let statebox

  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)

  let subscriptionId

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

  // Watch the board
  it('should watch the board', function (done) {
    statebox.startExecution(
      {
        stateMachineName: 'wmfs_incidentSummary_1_0',
        title: 'Incident 1/1999',
        description: 'Fire with 0 casualties and 0 fatalities',
        key: {
          'incidentNumber': 1,
          'incidentYear': 1999
        }
      },
      WATCH_BOARD_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'user2'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('WatchBoard')
        expect(executionDescription.currentResource).to.eql('module:watchBoard')
        expect(executionDescription.stateMachineName).to.eql(WATCH_BOARD_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  // Get the watched boards (to validate the above)
  it('should get the watched board to validate the previous test', function (done) {
    statebox.startExecution(
      {},
      GET_WATCHED_BOARDS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'user2'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetWatchedBoards')
        expect(executionDescription.currentResource).to.eql('module:getWatchedBoards')
        expect(executionDescription.stateMachineName).to.eql(GET_WATCHED_BOARDS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.total).to.eql(1)
        expect(executionDescription.ctx.subscriptions[0].feedName).to.eql('wmfs_incidentSummary_1_0|1|1999')
        subscriptionId = executionDescription.ctx.subscriptions[0].subscriptionId
        done()
      }
    )
  })

  // Get the watched boards (to validate the above)
  it('should delete the watched board to validate the previous test', function (done) {
    statebox.startExecution(
      {
        subscriptionId: subscriptionId
      },
      UNWATCH_BOARD_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('UnwatchBoard')
        expect(executionDescription.currentResource).to.eql('module:unwatchBoard')
        expect(executionDescription.stateMachineName).to.eql(UNWATCH_BOARD_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  // Delete rows from the table - this is temporary and will be replaced with unwatch execution
  it('clean up', function (done) {
    client.query(`DELETE FROM tymly.watched_boards where user_id = 'user2'`, function (err) {
      done(err)
    })
  })
})
