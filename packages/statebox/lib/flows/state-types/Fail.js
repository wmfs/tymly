'use strict'
const BaseStateType = require('./Base-state')

class Fail extends BaseStateType {
  constructor (stateName, flow, stateDefinition, executions, options) {
    super(stateName, flow, stateDefinition, executions, options)
    this.stateType = 'Fail'
    this.cause = stateDefinition.Cause
    this.error = stateDefinition.Error
    this.debug()
  }

  process (executionDescription) {
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
