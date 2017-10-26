'use strict'

class Moaning {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * Oh no... ' + ctx.petName + "'s started moaning!")
    callback(null)
  }

  leave (tymly, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Moaning
}
