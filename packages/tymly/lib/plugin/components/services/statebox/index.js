'use strict'

const Statebox = require('statebox')
const _ = require('lodash')

class StateboxService {
  boot (options, callback) {
    this.statebox = new Statebox(options)

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

  startExecution (input, stateMachineName, executionOptions, callback) {
    this.statebox.startExecution(input, stateMachineName, executionOptions, callback)
  }

  stopExecution (cause, error, executionName, executionOptions, callback) {
    this.statebox.stopExecution(cause, error, executionName, executionOptions, callback)
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
    this.statebox.waitUntilStoppedRunning(executionName, callback)
  }
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
