'use strict'

class Moaning {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * Oh no... ' + ctx.petName + "'s started moaning!")
    callback(null)
  }

  leave (flobot, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Moaning
}
