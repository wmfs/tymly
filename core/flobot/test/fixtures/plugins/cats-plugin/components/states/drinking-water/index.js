'use strict'

class DrinkingWater {

  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    callback(null)
  }

  leave (flobot, data, callback) {
    const ctx = flobot.ctx
    console.log(' * And to finish the meal, ' + ctx.petName + ' had some water')
    callback(null)
  }

}

module.exports = {
  autoNudge: true,
  stateClass: DrinkingWater
}
