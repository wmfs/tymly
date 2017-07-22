'use strict'

class EatingBiscuits {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * Would ' + ctx.petName + ' like biscuits to start? But of course!')
    callback(null)
  }

  leave (flobot, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: EatingBiscuits
}
