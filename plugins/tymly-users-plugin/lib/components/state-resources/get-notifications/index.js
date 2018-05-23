'use strict'

// 'new Date(event.startFrom).toLocaleString()' seems to work for timestamp with time zone as postgres type
// 'new Date().toLocaleString()' for the current date/time

class GetNotifications {
  init (resourceConfig, env, callback) {
    this.notifications = env.bootedServices.storage.models['tymly_notifications']
    callback(null)
  }

  run (event, context) {
    const payload = {
      notifications: []
    }
    const findOptions = {
      where: {
        userId: {equals: context.userId}
      }
    }
    if (event.startFrom) findOptions.where.created = {moreThanEquals: new Date(event.startFrom).toLocaleString()}

    this.notifications
      .find(findOptions)
      .then(results => {
        results.forEach(r => {
          if (!r.acknowledged) {
            payload.notifications.push({
              id: r.id,
              title: r.title,
              description: r.description,
              category: r.category,
              created: r.created
            })
          }
        })
        payload.totalNotifications = payload.notifications.length
        payload.limit = event.limit || 10
        context.sendTaskSuccess({userNotifications: payload})
      })
      .catch(err => context.sendTaskFailure({error: 'getNotificationsFail', cause: err}))
  }
}

module.exports = GetNotifications
