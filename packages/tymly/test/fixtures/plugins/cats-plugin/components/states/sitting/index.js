'use strict'

class Sitting {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * Look! ' + ctx.petName + ' is sitting!')
    callback(null)
  }

  leave (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * ' + ctx.petName + "'s done sitting... time for action!")
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Sitting
}
