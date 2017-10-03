'use strict'

// TODO: Make it do something!
class SendingEmail {
  init (stateConfig, options, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess()
  }
}

module.exports = SendingEmail
