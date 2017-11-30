'use strict'

class CreateToDoEntry {
  init (resourceConfig, env, callback) {
    this.todos = env.bootedServices.storage.models['tymly_todos']
    callback(null)
  }

  run (event, context) {
    const upsert = {
      userId: context.userId,
      todoTitle: event.todoTitle
    }
    if (event.id) upsert.id = event.id
    this.todos.upsert(
      upsert,
      {}
    )
      .then(() => context.sendTaskSuccess())
      .catch(err => context.sendTaskFailure(err))
  }
}

module.exports = CreateToDoEntry
