'use strict'

const dottie = require('dottie')
const _ = require('lodash')

class GetUserRemit {
  init (resourceConfig, env, callback) {
    this.categories = env.bootedServices.categories
    this.teams = env.bootedServices.storage.models['tymly_teams']
    this.todos = env.bootedServices.storage.models['tymly_todos']
    this.forms = env.bootedServices.forms
    this.boards = env.bootedServices.boards
    this.statebox = env.bootedServices.statebox
    // startables
    callback(null)
  }

  async run (event, context) {
    const userId = context.userId
    this.clientManifest = event.clientManifest
    const settings = {categoryRelevance: event.userSettings.categoryRelevance}
    let favourites = []
    if (event.favourites.results.length > 0) favourites = event.favourites.results[0].stateMachineNames

    const userRemit = {
      add: {},
      remove: {},
      settings: settings,
      favouriteStartableNames: favourites
    }

    const promises = [
      this.findComponents(userRemit, this.todos, 'todos', 'id', this.clientManifest['todos'], userId),
      this.findComponents(userRemit, this.teams, 'teams', 'title', this.clientManifest['teams'])
    ]

    if (this.categories) {
      promises.push(this.processComponents(userRemit, 'categories', this.categories.categories, this.clientManifest['categoryNames']))
    }

    if (this.forms) {
      promises.push(this.processComponents(userRemit, 'forms', this.forms.forms, this.clientManifest['formNames']))
    }

    if (this.boards) {
      promises.push(this.processComponents(userRemit, 'boards', this.boards.boards, this.clientManifest['boardNames']))
    }

    if (this.statebox) {
      const startable = this.findStartableMachines(this.statebox.listStateMachines(), this.categories.names)
      promises.push(this.processComponents(userRemit, 'startable', startable, this.clientManifest['startable']))
    }

    Promise.all(promises)
      .then(() => context.sendTaskSuccess({userRemit}))
      .catch(err => context.sendTaskFailure({error: 'getUserRemitFail', cause: err}))
  }

  findComponents (userRemit, model, componentType, titleCol, alreadyInClientManifest, userId) {
    const where = userId ? {where: {userId: {equals: userId}}} : {}
    return model.find(where)
      .then(results => {
        const resultsObj = {}
        results.map(r => { resultsObj[r[titleCol]] = r })
        this.processComponents(userRemit, componentType, resultsObj, alreadyInClientManifest)
      })
  } // findComponents

  processComponents (userRemit, componentType, components, alreadyInClientManifest) {
    Object.keys(components).map(componentName => {
      if (componentType === 'forms') {
        const formShasum = this.forms.forms[componentName].shasum
        const clientShasum = alreadyInClientManifest[componentName]
        if (formShasum !== clientShasum) {
          dottie.set(userRemit, `add.${componentType}.${componentName}`, this.forms.forms[componentName])
        }
      } else if (componentType === 'boards') {
        const boardShasum = this.boards.boards[componentName].shasum
        const clientShasum = alreadyInClientManifest[componentName]
        if (boardShasum !== clientShasum) {
          dottie.set(userRemit, `add.${componentType}.${componentName}`, this.boards.boards[componentName])
        }
      } else {
        if (alreadyInClientManifest.indexOf(componentName) === -1) {
          dottie.set(userRemit, `add.${componentType}.${componentName}`, components[componentName])
        }
      }
    })

    let namesToRemove
    if (_.isArray(alreadyInClientManifest)) {
      namesToRemove = _.difference(alreadyInClientManifest, Object.keys(components))
    } else if (_.isPlainObject(alreadyInClientManifest)) {
      namesToRemove = _.difference(Object.keys(alreadyInClientManifest), Object.keys(components))
    }
    if (namesToRemove.length > 0) {
      userRemit.remove[componentType] = namesToRemove
    }
    return userRemit
  } // processComponents

  findStartableMachines (machines, categories) {
    const startable = {}

    for (const machine of Object.values(machines)) {
      if (!machine.definition.categories || machine.definition.categories.length === 0) {
        continue
      }

      const category = machine.definition.categories[0]
      if (!categories.includes(category)) {
        continue
      }

      startable[machine.name] = {
        name: machine.name,
        title: machine.definition.name,
        description: machine.definition.description,
        category: category
      }
    } // for ...

    return startable
  } // findStartableMachines
}

module.exports = GetUserRemit
