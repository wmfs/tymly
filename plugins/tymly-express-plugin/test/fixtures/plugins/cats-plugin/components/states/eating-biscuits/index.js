'use strict'

class EatingBiscuits {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * Would ' + ctx.petName + ' like biscuits to start? But of course!')
    callback(null)
  }

  leave (tymly, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: EatingBiscuits
}
