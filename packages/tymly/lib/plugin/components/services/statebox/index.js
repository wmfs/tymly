'use strict'

const Statebox = require('statebox')
const _ = require('lodash')

function promiseOrCallback (p, callback) {
  if (callback) {
    p
      .then(r => callback(null, r))
      .catch(err => callback(err))
  } else {
    return p
  }
} // promiseOrCallback

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
      return this.startExecution(input, stateMachineName, executionOptions)
        .then(executionDescription => callback(null, executionDescription))
        .catch(err => callback(err))
    } // if ...

    const [authOk, errExecDesc] = await this.authorisationCheck(
      executionOptions.userId,
      stateMachineName,
      executionOptions,
      'create'
    )
    return authOk
      ? this.statebox.startExecution(input, stateMachineName, executionOptions)
      : errExecDesc
  } // startExecution

  async stopExecution (cause, error, executionName, executionOptions, callback) {
    if (callback) {
      return this.stopExecution(cause, error, executionName, executionOptions)
        .then(executionDescription => callback(null, executionDescription))
        .catch(err => callback(err))
    }

    const executionDescription = await this.statebox.describeExecution(executionName, executionOptions)
    const [authOk, errExecDesc] = await this.authorisationCheck(
      executionOptions.userId,
      executionDescription.stateMachineName,
      executionDescription.executionOptions,
      'stop'
    )
    return authOk
      ? this.statebox.stopExecution(cause, error, executionName, executionOptions)
      : errExecDesc
  } // stopExecution

  listExecutions (executionOptions, callback) {
    this.statebox.listExecutions(executionOptions, callback)
  }

  describeExecution (executionName, executionOptions, callback) {
    return this.statebox.describeExecution(executionName, executionOptions, callback)
  }

  async sendTaskSuccess (executionName, output, executionOptions, callback) {
    if (callback) {
      return promiseOrCallback(this.statebox.sendTaskSuccess(executionName, output, executionOptions), callback)
    }

    const executionDescription = await this.statebox.describeExecution(executionName, executionOptions)
    const [authOk, errExecDesc] = await this.authorisationCheck(
      executionOptions.userId,
      executionDescription.stateMachineName,
      executionDescription.executionOptions,
      'update'
    )

    // hmm, should we be returning the execution description here?
    if (authOk) {
      this.statebox.sendTaskSuccess(executionName, output, executionOptions)
    } else {
      throw new Error(errExecDesc.errorMessage)
    }
  } // sendTaskSuccess

  sendTaskHeartbeat (executionName, output, executionOptions, callback) {
    this.statebox.sendTaskHeartbeat(executionName, output, executionOptions, callback)
  }

  sendTaskFailure (executionName, output, executionOptions, callback) {
    this.statebox.sendTaskFailure(executionName, output, executionOptions, callback)
  }

  waitUntilStoppedRunning (executionName, callback) {
    const p = this.statebox.waitUntilStoppedRunning(executionName)

    return promiseOrCallback(p, callback)
  } // waitUntilStoppedRunning

  /*
  authorisationCheck (stateMachineName, executionOptions, action) {
    return [true] // STUB!
  }
  */

  async authorisationCheck (userId, stateMachineName, executionOptions, action) {
    const rbac = this.services.rbac

    const roles = await rbac.getUserRoles(userId)
    const authorised = rbac.checkRoleAuthorization(
      userId,
      executionOptions,
      roles,
      'stateMachine',
      stateMachineName,
      action
    )

    if (authorised) {
      return [true]
    } // if good ...

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
