'use strict'

module.exports = class FingingOne {
  init (resourceConfig, env, callback) {
    this.resourceConfig = resourceConfig
    console.log('PERSISTING CONFIG', resourceConfig)
    callback(null)
  }

  run (event, context) {
    console.log('PERSISTING EVENT>>>>', event)
    context.sendTaskSuccess()
  }
}
