'use strict'

const Statebox = require('statebox')
const _ = require('lodash')

class StateboxService {
  boot (options, callback) {
    const _this = this
    this.statebox = new Statebox()
    options.messages.info('Adding resources...')
    if (_.isObject(options.pluginComponents.stateResources)) {
      _.forOwn(
        options.pluginComponents.stateResources,
        function (stateResource, stateResourceName) {
          const StateResourceClass = stateResource.componentModule
          const stateResourceInstance = new StateResourceClass()
          _this.statebox.createModuleResource(
            stateResourceName,
            stateResourceInstance
          )
          options.messages.detail(stateResourceName)
        }
      )
    }
    options.messages.info('Adding state machines...')
    if (_.isObject(options.blueprintComponents.stateMachines)) {
      _.forOwn(
        options.blueprintComponents.stateMachines,
        function (stateMachineDefinition, stateMachineName) {
          const qualifiedName = stateMachineName
          _this.statebox.createStateMachine(
            stateMachineName,
            stateMachineDefinition
          )
          options.messages.detail(qualifiedName)
        }
      )
    }
    callback(null)
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
  serviceClass: StateboxService
}
