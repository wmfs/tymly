'use strict'

const schema = require('./schema.json')

class SendingEmail {
  init (stateConfig, options, callback) {
    this.emailService = options.services.email
    this.from = this.emailService.from
    callback(null)
  }

  enter (flobot, data, callback) {
    const _this = this
    this.getOptions(
      flobot,
      function (err, options) {
        if (err) {
          callback(err)
        } else {
          const mailOptions = {
            from: _this.from, // sender address
            to: options.to, // list of receivers
            subject: options.subject, // Subject line
            text: options.text // plaintext body
          }

          // send mail with defined transport object
          _this.emailService.transport.sendMail(mailOptions, function (err, info) {
            if (err) {
              callback(err)
            } else {
              callback(null)
            }
          })
        }
      }
    )
  }

  leave (flobot, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: SendingEmail,
  schema: schema
}
