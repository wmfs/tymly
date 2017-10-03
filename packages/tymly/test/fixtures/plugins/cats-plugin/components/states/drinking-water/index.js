'use strict'

class DrinkingWater {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (tymly, data, callback) {
    callback(null)
  }

  leave (tymly, data, callback) {
    const ctx = tymly.ctx
    console.log(' * And to finish the meal, ' + ctx.petName + ' had some water')
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: DrinkingWater
}
