'use strict'

module.exports = class Walking {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('WALKING....')
    event.petDiary.push(`${event.petName} is walking... where's ${event.gender === 'male' ? 'he' : 'she'} off to?`)
    context.sendTaskSuccess({
      petDiary: event.petDiary
    })
  }
}
