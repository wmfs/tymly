'use strict'

const dottie = require('dottie')
const _ = require('lodash')

class GetTodoChanges {
  init (resourceConfig, env, callback) {
    this.todos = env.bootedServices.storage.models['tymly_todos']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId // what about team name? Get the team this user is in?
    const clientTodoExecutionNames = event.clientTodoExecutionNames

    this.todos.find({where: {userId: {equals: userId}}})
      .then(results => {
        const resultsObj = {}
        const todoChanges = {
          add: {},
          remove: []
        }
        results.map(r => { resultsObj[r['id']] = r })
        this.processComponents(todoChanges, 'todoChanges', resultsObj, clientTodoExecutionNames)
        context.sendTaskSuccess({todoChanges})
      })
      .catch(err => context.sendTaskFailure({error: 'getTodoChangesFail', cause: err}))
  }

  processComponents (userRemit, componentType, components, alreadyInClientManifest) {
    _.forEach(
      Object.keys(components),
      function (componentName) {
        if (alreadyInClientManifest.indexOf(componentName) === -1) {
          dottie.set(userRemit, `add.${componentType}.${componentName}`, components[componentName])
        }
      }
    )

    const namesToRemove = _.difference(alreadyInClientManifest, Object.keys(components))
    if (namesToRemove.length > 0) {
      userRemit.remove[componentType] = namesToRemove
    }

    return userRemit
  }
}

module.exports = GetTodoChanges
