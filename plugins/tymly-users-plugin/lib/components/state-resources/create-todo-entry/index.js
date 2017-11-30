'use strict'

class CreateTodoEntry {
  init (resourceConfig, env, callback) {
    this.todos = env.bootedServices.storage.models['tymly_todos']
    callback(null)
  }

  run (event, context) {
    const upsert = {
      userId: context.userId,
      todoTitle: event.todoTitle,
      stateMachineTitle: event.stateMachineTitle,
      stateMachineCategory: event.stateMachineCategory,
      description: event.description
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

module.exports = CreateTodoEntry
