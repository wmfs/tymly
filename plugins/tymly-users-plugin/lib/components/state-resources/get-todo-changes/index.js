'use strict'

class GetTodoChanges {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskSuccess()
  }
}

module.exports = GetTodoChanges
