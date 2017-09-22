'use strict'

module.exports = class WakingUp {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    event.petDiary.push(`Look out, ${event.petName} is waking up!`)
    context.sendTaskSuccess()
  }
}
