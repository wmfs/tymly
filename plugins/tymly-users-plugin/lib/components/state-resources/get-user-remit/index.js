const _ = require('lodash')
const debug = require('debug')('tymly-users-plugin')
const shasum = require('shasum')

class GetUserRemit {
  init (resourceConfig, env, callback) {
    this.categories = env.bootedServices.categories
    this.teams = env.bootedServices.storage.models['tymly_teams']
    this.todos = env.bootedServices.storage.models['tymly_todos']
    this.forms = env.bootedServices.forms
    this.boards = env.bootedServices.boards
    this.statebox = env.bootedServices.statebox
    this.services = env.bootedServices
    callback(null)
  }

  async run (event, context) {
    const usersService = this.services.users
    const rbacService = this.services.rbac

    const userId = context.userId
    const userRoles = await new Promise((resolve, reject) => usersService.getUserRoles(userId, (err, roles) => {
      if (err) reject(err)
      else resolve(roles)
    }))

    const settings = {categoryRelevance: event.userSettings.categoryRelevance}
    const favourites = event.favourites.results.length > 0 ? event.favourites.results : []

    const userRemit = {
      add: {},
      remove: {},
      settings: settings,
      favouriteStartableNames: favourites
    }

    const promises = [
      this.findComponents(userRemit, this.todos, 'todos', 'id', event.clientManifest['todos'], userId),
      this.findComponents(userRemit, this.teams, 'teams', 'title', event.clientManifest['teams'])
    ]

    if (this.categories) {
      promises.push(this.processComponents(userRemit, 'categories', this.categories.categories, event.clientManifest['categoryNames']))
    }

    if (this.forms) {
      promises.push(this.processComponents(userRemit, 'forms', this.forms.forms, event.clientManifest['formNames']))
    }

    if (this.boards) {
      promises.push(this.processComponents(userRemit, 'boards', this.boards.boards, event.clientManifest['boardNames']))
    }

    if (this.statebox) {
      const startable = this.findStartableMachines(this.statebox.listStateMachines(), this.categories.names)
      const allowedStartable = Object.keys(startable).reduce((keys, resourceName) => {
        const isAuth = rbacService.checkRoleAuthorization(
          userId,
          context,
          userRoles,
          'stateMachine',
          resourceName,
          'create'
        )
        if (isAuth) {
          keys[resourceName] = startable[resourceName]
          keys[resourceName].shasum = shasum(startable[resourceName])
        }
        return keys
      }, {})
      promises.push(this.processComponents(userRemit, 'startable', allowedStartable, event.clientManifest['startable']))
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
        debug(componentType + ': ' + JSON.stringify(resultsObj, null, 2))
        this.processComponents(userRemit, componentType, resultsObj, alreadyInClientManifest)
      })
  } // findComponents

  processComponents (userRemit, componentType, components, alreadyInClientManifest) {
    userRemit.add[componentType] = {}

    Object.keys(components).forEach(componentName => {
      this.checkShasum(userRemit, alreadyInClientManifest, components[componentName], componentType, componentName)
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

  checkShasum (userRemit, alreadyInClientManifest, component, type, name) {
    if (component.shasum) {
      const componentShasum = component.shasum
      const clientShasum = alreadyInClientManifest[name]
      if (componentShasum !== clientShasum) {
        userRemit.add[type][name] = component
      }
    } else {
      if (!alreadyInClientManifest.includes(name)) {
        userRemit.add[type][name] = component
      }
    }
  }

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
