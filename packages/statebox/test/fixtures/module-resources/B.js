'use strict'

module.exports = class B {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    const list = event.results
    console.log('B')
    list.push('B')
    context.sendTaskSuccess({results: list})
  }
}
