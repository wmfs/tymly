'use strict'

class AcknowledgeNotifications {
  init (resourceConfig, env, callback) {
    this.notifications = env.bootedServices.storage.models['tymly_notifications']
    callback(null)
  }

  run (event, context) {
    const promises = event.notificationsToMark.map(id => {
      return this.notifications.update({
        id: id,
        userId: context.userId,
        acknowledged: new Date().toLocaleString()
      }, {setMissingPropertiesToNull: false})
    })

    Promise.all(promises)
      .then(() => context.sendTaskSuccess())
      .catch(err => context.sendTaskFailure({error: 'acknowledgeNotificationsFail', cause: err}))
  }
}

module.exports = AcknowledgeNotifications
