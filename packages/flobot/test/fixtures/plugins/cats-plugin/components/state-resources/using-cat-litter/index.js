'use strict'

module.exports = class Sitting {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    event.petDiary.push(`Stand back, ${event.petName} is using the cat litter!`)
    context.sendTaskSuccess(
      {
        hoursSinceLastMotion: 0
      }
    )
  }
}
