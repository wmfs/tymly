'use strict'

const Statebox = require('statebox')
const _ = require('lodash')

class StateboxService {
  boot (options, callback) {
    const _this = this
    this.statebox = new Statebox()

    options.messages.info('Expanding resource config references...')

    // Find config refs properties as highlighted throughout services...
    let allResourceConfigRefs = []
    _.forOwn(
      options.pluginComponents.services,
      function (serviceComponent) {
        const componentModule = serviceComponent.componentModule
        if (componentModule.hasOwnProperty('resourceConfigRefs')) {
          allResourceConfigRefs = allResourceConfigRefs.concat(componentModule.resourceConfigRefs)
        }
      }
    )
    allResourceConfigRefs.forEach(
      ref => options.messages.detail(ref)
    )

    function processResourceConfigRefs (root,
                                        namespace,
                                        version,
                                        allResourceConfigRefs) {
      if (_.isArray(root)) {
        root.forEach(
          function (element) {
            processResourceConfigRefs(
              element,
              namespace,
              version,
              allResourceConfigRefs
            )
          }
        )
      } else if (_.isObject(root)) {
        _.forOwn(
          root,
          function (value, key) {
            if (allResourceConfigRefs.indexOf(key) !== -1 && _.isString(value)) {
              let newValue = `${namespace}_${value}`
              if (version) {
                newValue = `${newValue}_${version.toString().replace('.', '_')}`
              }
              root[key] = newValue
            } else {
              processResourceConfigRefs(
                value,
                namespace,
                version,
                allResourceConfigRefs
              )
            }
          }
        )
      }
    }

    // Find all resource config in all machines...
    if (options.blueprintComponents.hasOwnProperty('stateMachines')) {
      _.forOwn(
        options.blueprintComponents.stateMachines,
        function (stateMachineDefinition, stateMachineName) {
          _.forOwn(
            stateMachineDefinition.States,
            function (stateDefinition, stateName) {
              if (stateDefinition.hasOwnProperty('ResourceConfig')) {
                const resourceConfig = stateDefinition.ResourceConfig
                processResourceConfigRefs(
                  resourceConfig,
                  stateMachineDefinition.namespace,
                  stateMachineDefinition.version,
                  allResourceConfigRefs
                )
              }
            }
          )
        }
      )
    }

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
  resourceConfigRefs: ['stateMachineName'],
  serviceClass: StateboxService
}
