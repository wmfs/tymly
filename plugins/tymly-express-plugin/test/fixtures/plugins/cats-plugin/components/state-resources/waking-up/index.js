'use strict'

module.exports = class WakingUp {
  boot (config, options, callback) {
    callback(null)
  }

  run (event, context) {
    event.petDiary.push(`Look out, ${event.petName} is waking up!`)
    context.sendTaskSuccess({
      petDiary: event.petDiary
    })
  }
}
