'use strict'

class CreateTodoEntry {
  init (resourceConfig, env, callback) {
    this.todos = env.bootedServices.storage.models['tymly_todos']
    callback(null)
  }

  run (event, context) {
    const upsert = {
      userId: context.userId,
      stateMachineTitle: event.stateMachineTitle,
      stateMachineCategory: event.stateMachineCategory,
      requiredHumanInput: event.requiredHumanInput,
      description: event.description,
      launches: event.launches
    }

    const todoTitle = [event.todoTitle]
    if (event.key) Object.keys(event.key).sort().map(k => todoTitle.push(event.key[k]))
    upsert.todoTitle = todoTitle.join('|')

    if (event.id) upsert.id = event.id

    this.todos.upsert(upsert, {})
      .then(() => context.sendTaskSuccess())
      .catch(err => context.sendTaskFailure(err))
  }
}

module.exports = CreateTodoEntry
