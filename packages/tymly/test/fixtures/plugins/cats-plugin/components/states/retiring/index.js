'use strict'

class Retiring {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * Get comfy ' + ctx.petName + '...')
    callback(null)
  }

  leave (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * ...see you in the morning, ' + ctx.petName)
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: Retiring
}
