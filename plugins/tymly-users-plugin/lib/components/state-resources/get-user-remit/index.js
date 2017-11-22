'use strict'

const dottie = require('dottie')
const _ = require('lodash')

class GetUserRemit {
  init (resourceConfig, env, callback) {
    this.categories = env.bootedServices.storage.models['tymly_categories']
    this.teams = env.bootedServices.storage.models['tymly_teams']
    this.todos = env.bootedServices.storage.models['tymly_todos']
    this.forms = env.bootedServices.forms
    this.boards = env.bootedServices.boards
    // startables
    callback(null)
  }

  run (event, context) {
    // const userId = context.userId
    const clientManifest = event.clientManifest
    let settings = {}
    let favourites = []
    if (event.userSettings.results.length > 0) settings = event.userSettings.results[0].categoryRelevance
    if (event.favourites.results.length > 0) favourites = event.favourites.results[0].stateMachineNames

    let userRemit = {
      add: {},
      remove: {},
      settings: settings,
      favouriteStartableNames: favourites
    }

    const promises = [
      this.findComponents(userRemit, 'categories', 'categoryNames', 'label', clientManifest),
      this.findComponents(userRemit, 'todos', 'todoExecutionNames', 'id', clientManifest),
      this.findComponents(userRemit, 'teams', 'teamNames', 'title', clientManifest)
    ]

    if (this.forms) {
      promises.push(this.processComponents(userRemit, 'formNames', this.forms.forms, clientManifest['formNames']))
    }

    if (this.boards) {
      promises.push(this.processComponents(userRemit, 'boardNames', this.boards.boards, clientManifest['boardNames']))
    }

    Promise.all(promises)
      .then(() => { context.sendTaskSuccess({userRemit}) })
      .catch(err => {
        context.sendTaskFailure({
          error: 'getUserRemitFail',
          cause: err
        })
      })
  }

  findComponents (userRemit, modelName, componentType, titleCol, clientManifest) {
    return new Promise((resolve, reject) => {
      this[modelName].find({}, (err, results) => {
        if (err) reject(err)
        let resultsObj = {}
        results.map(r => { resultsObj[r[titleCol]] = r })
        this.processComponents(userRemit, componentType, resultsObj, clientManifest[componentType])
        resolve()
      })
    })
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

module.exports = GetUserRemit
