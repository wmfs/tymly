'use strict'

class Eating {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx
    ctx.mealCount ++

    console.log(' * Rupert is ready for meal #' + ctx.mealCount + '!')

    callback(null)
  }

  leave (flobot, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: Eating
}
