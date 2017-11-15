'use strict'

const async = require('async')

/*
* TODO: Where does user ID come from? Will it come from env?
* TODO: What should this return in the context?
* TODO: Handle failure if notification not found (look at tymly-mock-api)
* TODO: pg-model and tymly/storage/memory-model need to handle dates
* */

class AcknowledgeNotifications {
  init (resourceConfig, env, callback) {
    this.client = env.bootedServices.storage.client
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    const _client = this.client
    const schemaName = context.stateMachineMeta.schemaName

    async.eachSeries(event.notificationIds, (id, cb) => {
      _client.query(
        `UPDATE ${schemaName}.notifications SET acknowledged = '${(new Date()).toUTCString()}'::timestamp with time ` +
        `zone where user_id = '${userId}' and notification_id = '${id}'`,
        (err) => {
          cb(err)
        }
      )
    }, (err) => {
      if (err) {
        context.sendTaskFailure(
          {
            error: 'acknowledgeNotificationsFail',
            cause: err
          }
        )
      } else {
        context.sendTaskSuccess()
      }
    })
  }
}

module.exports = AcknowledgeNotifications
