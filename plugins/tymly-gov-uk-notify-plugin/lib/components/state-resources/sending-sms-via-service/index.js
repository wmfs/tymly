'use strict'

module.exports = class SendingSmsViaService {
  init (stateConfig, options, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess()
  }
}
