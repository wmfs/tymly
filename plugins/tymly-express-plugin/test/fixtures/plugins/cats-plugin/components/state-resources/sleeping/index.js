'use strict'

module.exports = class Sleeping {
  boot (config, options, callback) {
    callback(null)
  }

  run (event, context) {
    event.petDiary.push(`Sweet dreams ${event.petName}! x`)
    console.log('SLEEPING!!!!!!!!')
    context.sendTaskSuccess()
  }
}
