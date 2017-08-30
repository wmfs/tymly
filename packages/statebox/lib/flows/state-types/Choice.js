'use strict'
const BaseStateType = require('./Base-state')
const aslChoiceProcessor = require('asl-choice-processor')

class Choice extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition, options)
    this.stateType = 'Choice'
    this.calculateNextState = aslChoiceProcessor(stateDefinition)
    this.client = options.client
    this.schemaName = options.schemaName
    this.nextSql = `UPDATE ${this.schemaName}.current_executions SET current_state_name=$1 WHERE execution_name=$2`
    this.debug()
  }

  process (executionDescription) {
    const executionName = executionDescription.executionName
    const nextStateName = this.calculateNextState(executionDescription.input)
    this.updateCurrentStateName(nextStateName, executionName)
  }
}

module.exports = Choice
