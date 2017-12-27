'use strict'

class CreateNotification {
  init (resourceConfig, env, callback) {
    this.notifications = env.bootedServices.storage.models['tymly_notifications']
    callback(null)
  }

  run (event, context) {
    const create = {
      userId: context.userId,
      title: event.title,
      description: event.description,
      category: event.category,
      launches: event.launches
    }

    this.notifications.create(create, {})
      .then(() => context.sendTaskSuccess())
      .catch((err) => context.sendTaskFailure(err))
  }
}

module.exports = CreateNotification
