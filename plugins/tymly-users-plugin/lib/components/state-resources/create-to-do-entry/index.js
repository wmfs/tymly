'use strict'

class CreateToDoEntry {
  init (resourceConfig, env, callback) {
    this.todos = env.bootedServices.storage.models['tymly_todos']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    const todoTitle = event.todoTitle
    this.todos.upsert(
      {
        userId: userId,
        todoTitle: todoTitle,
        id: event.id
      },
      {}
    ).then(() => {
      context.sendTaskSuccess()
    }).catch(err => context.sendTaskFailure(
      {
        error: 'createTodoFail',
        cause: err
      }
    ))
  }
}

module.exports = CreateToDoEntry
