'use strict'

class Eating {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (tymly, data, callback) {
    const ctx = tymly.ctx
    ctx.mealCount++

    console.log(' * Rupert is ready for meal #' + ctx.mealCount + '!')

    callback(null)
  }

  leave (tymly, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: Eating
}
