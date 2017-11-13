/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const assert = require('chai').assert
const async = require('async')
const PGClient = require('pg-client-helper')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_NOTIFICATIONS_STATE_MACHINE = 'tymlyUsersTest_getNotifications_1_0'
const ACKNOWLEDGE_NOTIFICATIONS_STATE_MACHINE = 'tymlyUsersTest_acknowledgeNotifications_1_0'

describe('tymly-users-plugin tests', function () {
  this.timeout(5000)
  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new PGClient(pgConnectionString)
  const limit = '10'
  const startFrom = '2017-10-21T14:20:30.414Z'
  let ctx
  let statebox

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/test-notifications-blueprint')
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
        limit: limit
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
        ctx = executionDescription.ctx
        done()
      }
    )
  })

  it('should check the returned context matches the notifications in the database', function (done) {
    let notifications = []
    client.query(
      `select * from tymly_users_test.notifications where user_id = 'user2'`,
      (err, results) => {
        if (err) done(err)
        expect(err).to.eql(null)
        async.eachSeries(results.rows, (row, cb) => {
          let notification = {
            notificationId: row.notification_id,
            title: row.title,
            description: row.description,
            created: row._created,
            category: row.category,
            launches: []
          }

          client.query(
            `select * from tymly_users_test.launches where notifications_notification_id = '${notification.notificationId}'`,
            (err, r) => {
              if (err) cb(err)
              notification.launches.push({
                title: r.rows[0].title,
                stateMachineName: r.rows[0].state_machine_name,
                input: r.rows[0].input
              })
              notifications.push(notification)
              cb(null)
            }
          )
        }, (err) => {
          if (err) done(err)
          expect(err).to.eql(null)
          expect(ctx.userNotifications).to.eql({
            notifications: notifications,
            totalNotifications: notifications.length,
            limit: limit
          })
          done()
        })
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
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetNotifications')
        expect(executionDescription.currentResource).to.eql('module:getNotifications')
        expect(executionDescription.stateMachineName).to.eql(GET_NOTIFICATIONS_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        assert.isAtLeast(Date.parse(executionDescription.ctx.userNotifications.notifications[0].created),
          Date.parse(startFrom), 'Notification is more recent than startFrom')
        done()
      }
    )
  })

  it('should acknowledge one notification', function (done) {
    statebox.startExecution(
      {
        notificationIds: ['97fd09f8-b8b2-11e7-abc4-cec278b6b50a']
      },
      ACKNOWLEDGE_NOTIFICATIONS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
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
      `select * from tymly_users_test.notifications where notification_id = '97fd09f8-b8b2-11e7-abc4-cec278b6b50a'`,
      (err, result) => {
        if (err) done(err)
        expect(err).to.eql(null)
        expect(result.rows[0].acknowledged).to.not.eql(null)
        done()
      }
    )
  })

  it('should clean up the test resources', function () {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })
})
