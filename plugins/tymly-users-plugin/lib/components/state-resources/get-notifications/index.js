'use strict'

const dottie = require('dottie')

// 'new Date(event.startFrom).toLocaleString()' seems to work for timestamp with time zone

class GetNotifications {
  init (resourceConfig, env, callback) {
    this.notifications = env.bootedServices.storage.models['tymly_notifications']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    const limit = event.limit || 10
    let executionDescription = {}
    let payload = {
      notifications: []
    }
    let findOptions = {
      where: {
        userId: {equals: userId}
      }
    }

    if (event.startFrom) findOptions.where.created = {moreThanEquals: new Date(event.startFrom).toLocaleString()}

    this.notifications.find(
      findOptions,
      (err, results) => {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'getNotificationsFail',
              cause: err
            }
          )
        } else {
          results.map(r => {
            payload.notifications.push({
              id: r.id,
              title: r.title,
              description: r.description,
              category: r.category,
              created: r.created
            })
          })
          payload.totalNotifications = payload.notifications.length
          payload.limit = limit
          dottie.set(executionDescription, 'userNotifications', payload)
          context.sendTaskSuccess(executionDescription)
        }
      }
    )
  }
}

module.exports = GetNotifications
