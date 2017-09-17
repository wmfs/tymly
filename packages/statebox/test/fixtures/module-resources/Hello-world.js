'use strict'

module.exports = class HelloWorld {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    console.log('HELLO WORLD!')
    context.sendTaskSuccess()
  }
}
