'use strict'

module.exports = class Subtract {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess(event.number1 - event.number2)
  }
}
