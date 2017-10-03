'use strict'

class Pooing {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * OK then... ' + ctx.petName + "'s squatting now")
    callback(null)
  }

  leave (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * All finished, ' + ctx.petName + '? -)')
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Pooing
}
