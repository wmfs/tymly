'use strict'

const dottie = require('dottie')

/*
* TODO: pg-model and tymly/storage/memory-model need to handle dates
* */

class GetNotifications {
  init (resourceConfig, env, callback) {
    this.notifications = env.bootedServices.storage.models['tymly_notifications']
    this.client = env.bootedServices.storage.client
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    /*
    if (event.startFrom) {...} else {
      this.notifications.find(
        {
          where: {
            userId: {equals: userId}
          }
        },
        (err, results) => {
          if (err) {
            context.sendTaskFailure(
              {
                error: 'getNotificationsFail',
                cause: err
              }
            )
          } else {
            context.sendTaskSuccess()
          }
        }
      )
    }
    */
    const limit = event.limit || 10
    let executionDescription = {}
    let payload = {
      notifications: []
    }

    let getNotificationsSql = `select * from tymly.notifications where user_id = '${userId}'`

    if (event.startFrom) {
      payload.startFrom = event.startFrom
      getNotificationsSql += ` and _created >= '${event.startFrom}'::date`
    }

    this.client.query(
      getNotificationsSql,
      (err, results) => {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'getNotificationsFail',
              cause: err
            }
          )
        } else {
          results.rows.map(r => {
            payload.notifications.push({
              id: r.id,
              title: r.title,
              description: r.description,
              category: r.category,
              created: r._created
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
