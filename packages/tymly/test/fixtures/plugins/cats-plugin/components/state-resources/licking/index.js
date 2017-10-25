'use strict'

module.exports = class Licking {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    event.petDiary.push(`${event.petName} is licking ${event.gender === 'male' ? 'him' : 'her'}self.`)
    console.log('LICKING!', context.executionName)
    context.sendTaskSuccess({
      petDiary: event.petDiary
    })
  }
}
