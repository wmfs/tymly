'use strict'

const dottie = require('dottie')

/*
* TODO: Where does user ID come from? Will it come from env?
* TODO: Have a model in the test/fixtures blueprint rather than produce tables via SQL, the problem atm is the UUID
* TODO: append launches to payload.notifications (will need to query on notificationID)
* */

class GetNotifications {
  init (resourceConfig, env, callback) {
    this.userId = 'user1'
    this.client = env.bootedServices.storage.client
    callback(null)
  }

  run (event, context) {
    const schemaName = context.stateMachineMeta.schemaName
    const limit = event.limit || 10
    let executionDescription = {}
    let payload = {
      notifications: []
    }

    this.client.query(
      `select * from ${schemaName}.notifications where user_id = '${this.userId}'`,
      function (err, results) {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'getNotificationsFail',
              cause: err
            }
          )
        } else {
          results.rows.map(row => {
            payload.notifications.push({
              notificationId: row.notification_id,
              title: row.title,
              description: row.description,
              created: row._created,
              category: row.category,
              launches: '?'
            })
          })
          payload.totalNotifications = payload.notifications.length
          payload.limit = limit
          if (event.startFrom) payload.startFrom = event.startFrom

          dottie.set(executionDescription, 'userNotifications', payload)
          context.sendTaskSuccess(executionDescription)
        }
      }
    )
  }
}

module.exports = GetNotifications
