'use strict'
const BaseStateType = require('./Base-state')
const aslChoiceProcessor = require('asl-choice-processor')

class Choice extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, 'Choice', options)
    this.calculateNextState = aslChoiceProcessor(stateDefinition)
    this.debug()
  }

  process (executionDescription) {
    const executionName = executionDescription.executionName
    const nextStateName = this.calculateNextState(executionDescription.ctx)
    this.updateCurrentStateName(nextStateName, executionName)
  }
}

module.exports = Choice
