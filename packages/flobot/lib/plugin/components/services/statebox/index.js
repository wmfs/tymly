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
      _this.statebox.createStateMachines(
        options.blueprintComponents.stateMachines,
        options,
        callback
      )
    } else {
      callback(null)
    }
  }

  findStateMachineByName (name) {
    return this.statebox.findStateMachineByName(name)
  }

  findStateMachines (options) {
    return this.statebox.findStateMachines(options)
  }

  startExecution (input, stateMachineName, executionOptions, callback) {
    this.statebox.startExecution(input, stateMachineName, executionOptions, callback)
  }

  stopExecution (cause, error, executionName, callback) {
    this.statebox.stopExecution(cause, error, executionName, callback)
  }

  listExecutions (callback) {
    this.statebox.listExecutions(callback)
  }

  describeExecution (executionName, callback) {
    this.statebox.listExecutions(executionName, callback)
  }

  waitUntilStoppedRunning (executionName, callback) {
    this.statebox.waitUntilStoppedRunning(executionName, callback)
  }
}

module.exports = {
  bootAfter: ['storage', 'commands', 'states', 'expression', 'temp'],
  refProperties: {
    stateMachineName: 'stateMachines'
  },
  serviceClass: StateboxService
}
