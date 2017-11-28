'use strict'

class Search {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess()
  }
}

module.exports = Search
