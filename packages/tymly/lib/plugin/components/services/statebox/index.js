'use strict'

const Statebox = require('statebox')
const _ = require('lodash')

class StateboxService {
  async boot (options, callback) {
    this.services = options.bootedServices

    this.statebox = new Statebox(options)
    await this.statebox.ready

    addResources(this.statebox, options)

    options.messages.info('Adding state machines...')
    if (_.isObject(options.blueprintComponents.stateMachines)) {
      const machines = Object.entries(options.blueprintComponents.stateMachines)

      const createMachine = (index) => {
        if (index === machines.length) {
          return callback(null)
        }

        const [name, definition] = machines[index]
        const meta = {
          name: name,
          namespace: definition.namespace,
          schemaName: _.snakeCase(definition.namespace),
          comment: definition.comment,
          version: definition.version
        }

        this.statebox.createStateMachine(
          name,
          definition,
          meta,
          options,
          () => createMachine(index + 1)
        )
      } // createMachine

      createMachine(0)
    } else {
      callback(null)
    }
  }

  findStateMachineByName (name) {
    return this.statebox.findStateMachineByName(name)
  }

  findStates (options) {
    return this.statebox.findStates(options)
  }

  findStateMachines (options) {
    return this.statebox.findStateMachines(options)
  }

  listStateMachines () {
    return this.statebox.listStateMachines()
  }

  async startExecution (input, stateMachineName, executionOptions, callback) {
    if (callback) {
      this.startExecution(input, stateMachineName, executionOptions)
        .then(executionDescription => callback(null, executionDescription))
        .catch(err => callback(err))
    } // if ...

    const [authOk, errExecDesc] = await this.authorisationCheck(stateMachineName, executionOptions, 'create')
    return authOk ?
      this.statebox.startExecution(input, stateMachineName, executionOptions) :
      errExecDesc
  } // startExecution

  stopExecution (cause, error, executionName, executionOptions, callback) {
    return this.statebox.stopExecution(cause, error, executionName, executionOptions, callback)
  }

  listExecutions (executionOptions, callback) {
    this.statebox.listExecutions(executionOptions, callback)
  }

  describeExecution (executionName, executionOptions, callback) {
    this.statebox.describeExecution(executionName, executionOptions, callback)
  }

  sendTaskSuccess (executionName, output, executionOptions, callback) {
    this.statebox.sendTaskSuccess(executionName, output, executionOptions, callback)
  }

  sendTaskHeartbeat (executionName, output, executionOptions, callback) {
    this.statebox.sendTaskHeartbeat(executionName, output, executionOptions, callback)
  }

  sendTaskFailure (executionName, output, executionOptions, callback) {
    this.statebox.sendTaskFailure(executionName, output, executionOptions, callback)
  }

  waitUntilStoppedRunning (executionName, callback) {
    return this.statebox.waitUntilStoppedRunning(executionName, callback)
  }

  async authorisationCheck (stateMachineName, executionOptions, action) {
    const rbac = this.services.rbac
    const userId = executionOptions.userId

    const roles = await rbac.getUserRoles(userId)
    const authorised = rbac.checkRoleAuthorization(
      userId,
      executionOptions,
      roles,
      'stateMachine',
      stateMachineName,
      action
    )

    if (authorised)
      return [true]

    return [
      false,
      {
        status: 'FAILED',
        stateMachineName: stateMachineName,
        errorCode: '401',
        errorMessage: `'${(typeof userId === 'string') ? userId : null}' can not perform '${action}' on '${stateMachineName}'`
      }
    ]
  } // authorisationCheck
} // class StateboxService

function addResources (statebox, options) {
  options.messages.info('Adding resources...')
  const stateResources = options.pluginComponents.stateResources
  if (!_.isObject(stateResources)) {
    return
  }

  const resourceClasses = {}
  for (const [name, resource] of Object.entries(stateResources)) {
    resourceClasses[name] = resource.componentModule
  } // for ...

  statebox.createModuleResources(resourceClasses)
} // _addResources

module.exports = {
  bootAfter: ['storage', 'temp', 'categories', 'registry'],
  refProperties: {
    stateMachineName: 'stateMachines'
  },
  serviceClass: StateboxService
}
