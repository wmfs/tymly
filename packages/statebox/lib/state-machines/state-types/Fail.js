'use strict'
const BaseStateType = require('./Base-state')
const debugPackage = require('debug')('statebox')

class Fail extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, 'Fail', options)
    this.cause = stateDefinition.Cause
    this.error = stateDefinition.Error
    this.debug()
  }

  process (executionDescription) {
    debugPackage(`Encountered fail state '${this.name}' in stateMachine '${this.stateMachineName}' (executionName='${executionDescription.executionName}')`)
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
