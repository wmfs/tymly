'use strict'

class CreateToDoEntry {
  init (resourceConfig, env, callback) {
    this.todos = env.bootedServices.storage.models['tymly_todos']
    callback(null)
  }

  run (event, context) {
    console.log('>>>' + event)
    console.log('context:', context)
    const userId = context.userId
    const todoTitle = event.todoTitle
    console.log('$$$$ - ' + userId + todoTitle)
    this.todos.upsert(
      {
        userId: userId,
        todoTitle: todoTitle
      },
      {}
    ).then(() => {
      context.sendTaskSuccess()
    }).catch(err => context.sendTaskFailure(err))
  }
}

module.exports = CreateToDoEntry
