'use strict'
const debug = require('debug')('statebox')
const functionClasses = {}

module.exports.findModuleByName = function findModuleByName (name) {
  return functionClasses[name]
}

// Adds a class for creating
module.exports.createModule = function createModule (name, stateFunction) {
  const ModuleResource = function ModuleResource (executionName, state) {
    const _this = this
    this.schemaName = _this.schemaName
    this.client = _this.client
    this.executionName = executionName
    this.state = state
  }

  ModuleResource.prototype.run = stateFunction
  ModuleResource.prototype.sendTaskSuccess = function (output) {
    this.state.processTaskSuccess(output, this.executionName)
  }

  functionClasses[name] = ModuleResource
  debug(`Created module resource '${name}'`)
}
