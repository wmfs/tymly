'use strict'

class Retiring {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * Get comfy ' + ctx.petName + '...')
    callback(null)
  }

  leave (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * ...see you in the morning, ' + ctx.petName)
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: Retiring
}
