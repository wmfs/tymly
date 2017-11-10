'use strict'

const dottie = require('dottie')

class GetNotifications {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    let executionDescription = {}
    const limit = event.limit || 10
    // const userID
    let payload = {}

    // select * from tymly.notifications where user_id = this.userID
    payload.notifications = ['1st', '2nd', '3rd']
    payload.totalNotifications = payload.notifications.length
    payload.limit = limit
    if (event.startFrom) payload.startFrom = event.startFrom
    dottie.set(executionDescription, 'userNotifications', payload)
    context.sendTaskSuccess(executionDescription)
  }
}

module.exports = GetNotifications
