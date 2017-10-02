'use strict'

class EatingTuna {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (tymly, data, callback) {
    callback(null)
  }

  leave (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * ' + ctx.petName + ' had some tuna for his main.')
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: EatingTuna
}
