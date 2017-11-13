/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const PGClient = require('pg-client-helper')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_NOTIFICATIONS_STATE_MACHINE = 'tymly_getNotifications_1_0'

describe('tymly-users-plugin tests', function () {
  this.timeout(5000)
  let statebox
  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new PGClient(pgConnectionString)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, '../lib/blueprints/notifications-blueprint')
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
    return sqlScriptRunner('./db-scripts/setup.sql', client)
  })

  it('should start the state resource execution to retrieve some notifications', function (done) {
    statebox.startExecution(
      {
        startFrom: '2017-10-21T14:20:30.414Z',
        limit: '10'
      },
      GET_NOTIFICATIONS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetNotifications')
        expect(executionDescription.currentResource).to.eql('module:getNotifications')
        expect(executionDescription.stateMachineName).to.eql(GET_NOTIFICATIONS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should clean up the test resources', () => {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })
})
