'use strict'

class CreateToDoEntry {
  init (resourceConfig, env, callback) {
    this.todos = env.bootedServices.storage.models['tymly_todos']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    const todoTitle = event.todoTitle
    const stateMachineTitle = event.stateMachineTitle

    this.todos.upsert(
      {
        userId: userId,
        todoTitle: todoTitle,
        stateMachineTitle: stateMachineTitle
      },
      {}
    ).then(() => {
      context.sendTaskSuccess()
    }).catch(err => context.sendTaskFailure(err))
  }
}

module.exports = CreateToDoEntry
