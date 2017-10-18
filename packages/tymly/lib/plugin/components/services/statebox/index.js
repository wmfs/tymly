'use strict'

const Statebox = require('statebox')
const _ = require('lodash')

class StateboxService {
  boot (options, callback) {
    const _this = this
    this.statebox = new Statebox()
    options.messages.info('Adding resources...')
    if (_.isObject(options.pluginComponents.stateResources)) {
      const resourceClasses = {}
      _.forOwn(
        options.pluginComponents.stateResources,
        function (resource, resourceName) {
          resourceClasses[resourceName] = resource.componentModule
        }
      )
      _this.statebox.createModuleResources(resourceClasses)
    }

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

        _this.statebox.createStateMachine(
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
}

module.exports = {
  bootAfter: ['storage', 'commands', 'temp'],
  refProperties: {
    stateMachineName: 'stateMachines'
  },
  serviceClass: StateboxService
}
