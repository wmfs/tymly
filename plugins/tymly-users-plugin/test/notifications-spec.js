/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const assert = require('chai').assert
const HlPgClient = require('hl-pg-client')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_NOTIFICATIONS_STATE_MACHINE = 'tymly_getNotifications_1_0'
const ACKNOWLEDGE_NOTIFICATIONS_STATE_MACHINE = 'tymly_acknowledgeNotifications_1_0'

describe('notifications tymly-users-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)
  const limit = '10'
  const startFrom = '2017-10-21T14:20:30.414Z'
  let statebox
  let idToAcknowledge

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
        done()
      }
    )
  })

  it('should create the test resources', function () {
    return sqlScriptRunner('./db-scripts/notifications/setup.sql', client)
  })

  it('should start the state resource execution to retrieve some notifications for a specified user', function (done) {
    statebox.startExecution(
      {
        limit: limit
      },
      GET_NOTIFICATIONS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        // console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetNotifications')
        expect(executionDescription.currentResource).to.eql('module:getNotifications')
        expect(executionDescription.stateMachineName).to.eql(GET_NOTIFICATIONS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.userNotifications.totalNotifications).to.eql(2)
        expect(executionDescription.ctx.userNotifications.notifications[0].title).to.eql('Expense claim #2')
        expect(executionDescription.ctx.userNotifications.notifications[1].title).to.eql('Employee Info #3')
        done()
      }
    )
  })

  it('should check the context returned when passing a \'startFrom\'', function (done) {
    statebox.startExecution(
      {
        startFrom: startFrom,
        limit: limit
      },
      GET_NOTIFICATIONS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        // console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetNotifications')
        expect(executionDescription.currentResource).to.eql('module:getNotifications')
        expect(executionDescription.stateMachineName).to.eql(GET_NOTIFICATIONS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        assert.isAtLeast(Date.parse(executionDescription.ctx.userNotifications.notifications[0].created), Date.parse(startFrom), 'Notification is more recent than startFrom')
        idToAcknowledge = executionDescription.ctx.userNotifications.notifications[0].id
        done()
      }
    )
  })

  it('should acknowledge one notification', function (done) {
    statebox.startExecution(
      {
        notificationIds: [idToAcknowledge]
      },
      ACKNOWLEDGE_NOTIFICATIONS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        // console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('AcknowledgeNotifications')
        expect(executionDescription.currentResource).to.eql('module:acknowledgeNotifications')
        expect(executionDescription.stateMachineName).to.eql(ACKNOWLEDGE_NOTIFICATIONS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should check the notification is acknowledged', function (done) {
    client.query(
      `select * from tymly.notifications where id = '${idToAcknowledge}'`,
      (err, result) => {
        if (err) done(err)
        expect(err).to.eql(null)
        expect(result.rows[0].acknowledged).to.not.eql(null)
        expect(result.rows[0].user_id).to.eql('test-user')
        expect(result.rows[0].title).to.eql('Employee Info #3')
        done()
      }
    )
  })

  it('should clean up the test resources', function () {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })
})
