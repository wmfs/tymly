'use strict'

const NotifyClient = require('notifications-node-client').NotifyClient

module.exports = class GetMessageStatusViaService {
  init (stateConfig, options, callback) {
    this.notifyClient = process.env.GOV_UK_NOTIFY_API_KEY && new NotifyClient(process.env.GOV_UK_NOTIFY_API_KEY)
    if (this.notifyClient && process.env.PROXY_URL) this.notifyClient.setProxy(process.env.PROXY_URL)
    callback(null)
  }

  run (event, context) {
    if (this.notifyClient) {
      this.notifyClient
        .getNotificationById(event.notificationId)
        .then(response => {
          if (response.statusCode === 200) {
            context.sendTaskSuccess({message: response.body})
          } else {
            context.sendTaskFailure({
              cause: new Error(`${response.statusCode}: ${response.statusMessage}`),
              err: 'FAILED_TO_GET_MESSAGE_STATUS'
            })
          }
        })
        .catch(err => context.sendTaskFailure({cause: err, error: 'FAILED_TO_GET_MESSAGE_STATUS'}))
    } else {
      context.sendTaskFailure({
        cause: new Error('missing env variable'),
        error: 'MISSING_GOV_UK_NOTIFY_API_KEY'
      })
    }
  }
}
