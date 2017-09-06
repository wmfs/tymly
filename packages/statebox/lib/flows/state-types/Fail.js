'use strict'
const BaseStateType = require('./Base-state')
const debugPackage = require('debug')('statebox')

class Fail extends BaseStateType {
  constructor (stateName, flow, stateDefinition, executions, options) {
    super(stateName, flow, stateDefinition, executions, options)
    this.stateType = 'Fail'
    this.cause = stateDefinition.Cause
    this.error = stateDefinition.Error
    this.debug()
  }

  process (executionDescription) {
    debugPackage(`Encountered fail state '${this.name}' in flow '${this.flowName}' (executionName='${executionDescription.executionName}')`)
    this.processTaskFailure(
      {
        cause: this.cause,
        error: this.error
      },
      executionDescription.executionName
    )
  }
}

module.exports = Fail
