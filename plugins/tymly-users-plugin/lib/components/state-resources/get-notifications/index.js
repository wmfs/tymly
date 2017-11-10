'use strict'

class GetNotifications {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    this.startFrom = event.startFrom
    this.limit = event.limit

    console.log('INPUTS:')
    console.log('> startFrom:' + this.startFrom)
    console.log('> limit:' + this.limit)

    context.sendTaskSuccess()
  }
}

module.exports = GetNotifications
