'use strict'

class EatingTuna {

  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    callback(null)
  }

  leave (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * ' + ctx.petName + ' had some tuna for his main.')
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: EatingTuna
}
