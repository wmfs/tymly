'use strict'

const async = require('async')

class AcknowledgeNotifications {
  init (resourceConfig, env, callback) {
    this.notifications = env.bootedServices.storage.models['tymly_notifications']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId

    async.eachSeries(event.notificationIds, (id, cb) => {
      this.notifications.update(
        {
          id: id,
          userId: userId,
          acknowledged: new Date().toLocaleString()
        },
        {},
        function (err) {
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
