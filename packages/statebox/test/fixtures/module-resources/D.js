'use strict'

module.exports = class D {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    const list = event.results
    console.log('D')
    list.push('D')
    context.sendTaskSuccess({results: list})
  }
}
