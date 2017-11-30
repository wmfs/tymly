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
    const stateMachineCategory = event.stateMachineCategory
    const description = event.description
    const id = event.id

    this.todos.upsert(
      {
        userId: userId,
        todoTitle: todoTitle,
        stateMachineTitle: stateMachineTitle,
        stateMachineCategory: stateMachineCategory,
        description: description,
        id: id
      },
      {}
    ).then(() => {
      context.sendTaskSuccess()
    }).catch(err => context.sendTaskFailure(err))
  }
}

module.exports = CreateToDoEntry
