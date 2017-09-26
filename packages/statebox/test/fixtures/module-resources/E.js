'use strict'

module.exports = class E {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    const list = event.results
    console.log('E')
    list.push('E')
    context.sendTaskSuccess({results: list})
  }
}
