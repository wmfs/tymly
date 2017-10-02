'use strict'

module.exports = class Logging {
  init (resourceConfig, env, callback) {
    this.template = resourceConfig.template
    callback(null)
  }

  run (event, context) {
    console.log(this.template)
    context.sendTaskSuccess()
  }
}
