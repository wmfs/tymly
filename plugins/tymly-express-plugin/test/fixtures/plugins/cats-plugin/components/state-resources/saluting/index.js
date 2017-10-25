'use strict'

module.exports = class Saluting {
  boot (config, options, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('SALUTING!!!!', context.executionName)
    event.petDiary.push(`It looks like ${event.petName} is saluting!`)
    context.sendTaskSuccess({
      petDiary: event.petDiary
    })
  }
}
