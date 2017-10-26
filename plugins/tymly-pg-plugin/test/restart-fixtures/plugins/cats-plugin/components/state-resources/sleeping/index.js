'use strict'

module.exports = class Sleeping {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    event.petDiary.push(`Sweet dreams ${event.petName}! x`)
    console.log('SLEEPING!!!!!!!!')
    context.sendTaskSuccess({
      petDiary: event.petDiary
    })
  }
}
