'use strict'

module.exports = class World {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('...WORLD!')
    context.sendTaskSuccess()
  }
}
