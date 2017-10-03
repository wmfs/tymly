'use strict'

class Sleeping {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * Sweet dreams ' + ctx.petName + '!')
    callback(null)
  }

  leave (tymly, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Sleeping
}
