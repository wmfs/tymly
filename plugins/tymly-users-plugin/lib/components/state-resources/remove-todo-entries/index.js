'use strict'

class RemoveTodoEntries {
  init (resourceConfig, env, callback) {
    this.todos = env.bootedServices.storage.models['tymly_todos']
    callback(null)
  }

  run (event, context) {
    this.todos.destroyById(event.todoId)
      .then(context.sendTaskSuccess())
      .catch(err => context.sendTaskFailure({error: 'removeTodoFail', cause: err}))
  }
}

module.exports = RemoveTodoEntries
