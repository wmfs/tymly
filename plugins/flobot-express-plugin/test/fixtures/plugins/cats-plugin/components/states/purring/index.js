'use strict'

class Purring {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * Can you hear that? ' + ctx.petName + ' is purring! :-)')
    callback(null)
  }

  leave (flobot, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Purring
}
