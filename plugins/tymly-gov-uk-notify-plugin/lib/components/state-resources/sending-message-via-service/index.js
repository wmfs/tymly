'use strict'

const NotifyClient = require('notifications-node-client').NotifyClient

module.exports = class SendingMessageViaService {
  init (stateConfig, options, callback) {
    this.notifyClient = process.env.GOV_UK_NOTIFY_API_KEY && new NotifyClient(process.env.GOV_UK_NOTIFY_API_KEY)
    if (process.env.PROXY_URL) this.notifyClient.setProxy(process.env.PROXY_URL)
    this.templateId = stateConfig.templateId
    this.messageType = stateConfig.messageType
    callback(null)
  }

  run (event, context) {
    if (this.notifyClient) {
      switch (this.messageType) {
        case 'mail':
          this.sendMail(event, context)
          break
        case 'sms':
          this.sendSms(event, context)
          break
      }
    } else {
      context.sendTaskFailure({
        cause: new Error('missing env variable'),
        error: 'Missing ENV: GOV_UK_NOTIFY_API_KEY'
      })
    }
  }

  sendSms (event, context) {
    this.notifyClient
      .sendSms(
        this.templateId,
        event.phoneNumber,
        {}
      )
      .then(response => {
        if (response.statusCode === 201) context.sendTaskSuccess({sentMessage: response.body})
        else context.sendTaskFailure({cause: new Error('created sms fail'), error: 'Failed to Create SMS'})
      })
      .catch(err => context.sendTaskFailure({cause: err, error: 'Send SMS Fail'}))
  }

  sendMail (event, context) {
    this.notifyClient
      .sendEmail(
        this.templateId,
        event.emailAddress,
        {}
      )
      .then(response => {
        if (response.statusCode === 201) context.sendTaskSuccess({sentMessage: response.body})
        else context.sendTaskFailure({cause: new Error('created mail fail'), error: 'Failed to Create Mail'})
      })
      .catch(err => context.sendTaskFailure({cause: err, error: 'Send Mail Fail'}))
  }
}
