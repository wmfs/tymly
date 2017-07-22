'use strict'

class Sitting {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * Look! ' + ctx.petName + ' is sitting!')
    callback(null)
  }

  leave (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * ' + ctx.petName + "'s done sitting... time for action!")
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Sitting
}
