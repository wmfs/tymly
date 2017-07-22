'use strict'

class Sleeping {

  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * Sweet dreams ' + ctx.petName + '!')
    callback(null)
  }

  leave (flobot, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Sleeping
}
