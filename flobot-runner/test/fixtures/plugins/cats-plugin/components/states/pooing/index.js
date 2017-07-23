'use strict'

class Pooing {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * OK then... ' + ctx.petName + "'s squatting now")
    callback(null)
  }

  leave (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * All finished, ' + ctx.petName + '? -)')
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Pooing
}
