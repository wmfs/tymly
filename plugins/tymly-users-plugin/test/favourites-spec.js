/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const HlPgClient = require('hl-pg-client')
const expect = require('chai').expect
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_FAVOURITE_STATE_MACHINE = 'tymly_getFavouriteStartableNames_1_0'
const SET_FAVOURITE_STATE_MACHINE = 'tymly_setFavouriteStartableNames_1_0'

describe('favourites tymly-users-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox
  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)
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

  it('should create the test resources', function () {
    return sqlScriptRunner('./db-scripts/favourites/setup.sql', client)
  })

  it('should get test-user\'s favourites', function (done) {
    statebox.startExecution(
      {},
      GET_FAVOURITE_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('GetFavouriteStartableNames')
        expect(executionDescription.currentResource).to.eql('module:getFavouriteStartableNames')
        expect(executionDescription.stateMachineName).to.eql(GET_FAVOURITE_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.results[0].userId).to.eql('test-user')
        done()
      }
    )
  })
  it('should update test-user\'s favourites', function (done) {
    statebox.startExecution(
      {
        stateMachineNames: '["wmfs_claimAnExpense_1_0", "wmfs_reportHydrantDefect_1_0", "notifications"]'
      },
      SET_FAVOURITE_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('SetFavouriteStartableNames')
        expect(executionDescription.currentResource).to.eql('module:setFavouriteStartableNames')
        expect(executionDescription.stateMachineName).to.eql(SET_FAVOURITE_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })
  it('should ensure test-user\'s applied favourites are present in DB', function (done) {
    statebox.startExecution(
      {},
      GET_FAVOURITE_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('GetFavouriteStartableNames')
        expect(executionDescription.currentResource).to.eql('module:getFavouriteStartableNames')
        expect(executionDescription.stateMachineName).to.eql(GET_FAVOURITE_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.results[0].userId).to.eql('test-user')
        expect(executionDescription.ctx.results[0].stateMachineNames).to.eql(
          [ 'wmfs_claimAnExpense_1_0', 'wmfs_reportHydrantDefect_1_0', 'notifications' ]
        )
        done()
      }
    )
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./db-scripts/favourites/cleanup.sql', client)
  })
})
