'use strict'

module.exports = class Licking {
  boot (config, options, callback) {
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
