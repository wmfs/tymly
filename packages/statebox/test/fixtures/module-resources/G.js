'use strict'

module.exports = class G {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    const list = event.results
    console.log('G')
    list.push('G')
    context.sendTaskSuccess({results: list})
  }
}
