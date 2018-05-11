'use strict'

module.exports = class SendingMailViaService {
  init (stateConfig, options, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess()
  }
}
