'use strict'

module.exports = class Walking {
  boot (config, options, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('SITTING!!!!', context.executionName)
    event.petDiary.push(`${event.petName} is sitting.`)
    context.sendTaskSuccess({
      petDiary: event.petDiary
    })
  }
}
