'use strict'

const dottie = require('dottie')
const async = require('async')

/*
* TODO: Where does user ID come from? Will it come from env?
* TODO: Have a model in the test/fixtures blueprint rather than produce tables via SQL, the problem atm is the UUID
* */

class GetNotifications {
  init (resourceConfig, env, callback) {
    this.userId = 'user1'
    this.client = env.bootedServices.storage.client
    callback(null)
  }

  run (event, context) {
    const _client = this.client
    const schemaName = context.stateMachineMeta.schemaName
    const limit = event.limit || 10
    let executionDescription = {}
    let payload = {
      notifications: []
    }

    // Get the notifications for this user
    _client.query(
      `select * from ${schemaName}.notifications where user_id = '${this.userId}'`,
      (err, results) => {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'getNotificationsFail',
              cause: err
            }
          )
        } else {
          // For each notification, find what 'launches' it
          // Append to payload
          async.eachSeries(results.rows, (row, cb) => {
            let notification = {
              notificationId: row.notification_id,
              title: row.title,
              description: row.description,
              created: row._created,
              category: row.category,
              launches: []
            }
            _client.query(
              `select * from ${schemaName}.launches where notifications_notification_id = '${notification.notificationId}'`,
              (err, r) => {
                if (err) cb(err)
                notification.launches.push({
                  title: r.rows[0].title,
                  stateMachineName: r.rows[0].state_machine_name,
                  input: r.rows[0].input
                })
                payload.notifications.push(notification)
                cb(null)
              }
            )
          }, (err) => {
            if (err) {
              context.sendTaskFailure(
                {
                  error: 'getNotificationsFail',
                  cause: err
                }
              )
            } else {
              // Append other information to payload
              // Send back as context
              payload.totalNotifications = payload.notifications.length
              payload.limit = limit
              if (event.startFrom) payload.startFrom = event.startFrom

              dottie.set(executionDescription, 'userNotifications', payload)
              context.sendTaskSuccess(executionDescription)
            }
          })
        }
      }
    )
  }
}

module.exports = GetNotifications
