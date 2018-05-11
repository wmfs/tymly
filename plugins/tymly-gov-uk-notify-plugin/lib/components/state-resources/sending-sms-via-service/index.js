'use strict'

const NotifyClient = require('notifications-node-client').NotifyClient

module.exports = class SendingSmsViaService {
  init (stateConfig, options, callback) {
    this.notifyClient = process.env.GOV_UK_NOTIFY_API_KEY && new NotifyClient(process.env.GOV_UK_NOTIFY_API_KEY)
    this.templateId = stateConfig.templateId
    if (process.env.PROXY_URL) this.notifyClient.setProxy(process.env.PROXY_URL)
    callback(null)
  }

  run (event, context) {
    if (this.notifyClient) {
      this.notifyClient
        .sendSms(
          this.templateId,
          event.phoneNumber,
          {}
        )
        .then(response => {
          if (response.statusCode === 201) context.sendTaskSuccess()
          else context.sendTaskFailure({cause: new Error('created sms fail'), error: 'Failed to Create SMS'})
        })
        .catch(err => context.sendTaskFailure({cause: err, error: 'Send SMS Fail'}))
    } else {
      context.sendTaskFailure({
        cause: new Error('missing env variable'),
        error: 'Missing ENV: GOV_UK_NOTIFY_API_KEY'
      })
    }
  }
}
