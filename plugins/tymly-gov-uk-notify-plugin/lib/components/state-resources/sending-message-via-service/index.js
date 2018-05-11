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
      if (this.messageType === 'mail' && event.emailAddress) {
        this.sendMail(event, context)
      } else if (this.messageType === 'sms' && event.phoneNumber) {
        this.sendSms(event, context)
      } else if (!['sms', 'mail'].includes(this.messageType)) {
        context.sendTaskFailure({
          error: 'INVALID_MESSAGE_TYPE',
          cause: new Error('message type must be sms or mail')
        })
      } else {
        context.sendTaskFailure({
          error: 'NO_EMAIL_OR_PHONE_NUMBER',
          cause: new Error('no phone number or email address provided')
        })
      }
    } else {
      context.sendTaskFailure({
        cause: new Error('missing env variable'),
        error: 'MISSING_GOV_UK_NOTIFY_API_KEY'
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
        else context.sendTaskFailure({cause: new Error('created sms fail'), error: 'CREATE_SMS_FAIL'})
      })
      .catch(err => context.sendTaskFailure({cause: err, error: 'SEND_SMS_FAIL'}))
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
        else context.sendTaskFailure({cause: new Error('created mail fail'), error: 'CREATE_MAIL_FAIL'})
      })
      .catch(err => context.sendTaskFailure({cause: err, error: 'SEND_MAIL_FAIL'}))
  }
}
