'use strict'
const debug = require('debug')('statebox')
const functionClasses = {}

module.exports.findFunctionClassByName = function findFunctionClassByName (name) {
  return functionClasses[name]
}

// Adds a class for creating
module.exports.createFunction = function createFunction (name, stateFunction) {
  const StateFunction = function StateFunction (executionName, state) {
    const _this = this
    this.schemaName = _this.schemaName
    this.client = _this.client
    this.executionName = executionName
    this.state = state
  }

  StateFunction.prototype.run = stateFunction
  StateFunction.prototype.sendTaskSuccess = function (output) {
    this.state.processTaskSuccess(output, this.executionName)
  }

  functionClasses[name] = StateFunction
  debug(`Created function resource '${name}'`)
}
