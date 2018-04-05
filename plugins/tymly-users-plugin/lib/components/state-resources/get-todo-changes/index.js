const _ = require('lodash')

class GetTodoChanges {
  init (resourceConfig, env, callback) {
    this.todos = env.bootedServices.storage.models['tymly_todos']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId // what about team name? Get the team this user is in?
    const clientTodos = event.clientTodos

    this.todos.find({where: {userId: {equals: userId}}})
      .then(results => {
        const resultsObj = {}
        const todoChanges = {
          add: {},
          remove: []
        }
        results.map(r => { resultsObj[r['id']] = r })
        this.processComponents(todoChanges, resultsObj, clientTodos)
        context.sendTaskSuccess({todoChanges})
      })
      .catch(err => context.sendTaskFailure({error: 'getTodoChangesFail', cause: err}))
  }

  processComponents (userRemit, components, alreadyInClientManifest) {
    console.log(alreadyInClientManifest)
    Object.keys(components).forEach(componentId => {
      if (!alreadyInClientManifest.includes(componentId)) {
        userRemit.add[componentId] = components[componentId]
      }
    })

    const namesToRemove = _.difference(alreadyInClientManifest, Object.keys(components))
    if (namesToRemove.length > 0) {
      userRemit.remove = namesToRemove
    }

    return userRemit
  }
}

module.exports = GetTodoChanges
