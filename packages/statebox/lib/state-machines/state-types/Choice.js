'use strict'
const BaseStateType = require('./Base-state')
const aslChoiceProcessor = require('asl-choice-processor')

class Choice extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, options)
    this.stateType = 'Choice'
    this.states = stateMachine.states
    this.calculateNextState = aslChoiceProcessor(stateDefinition)
    this.debug()
  }

  process (executionDescription) {
    const executionName = executionDescription.executionName
    const nextStateName = this.calculateNextState(executionDescription.ctx)
    const nextResource = this.states[nextStateName].definition.Resource
    this.updateCurrentStateName(nextStateName, nextResource, executionName)
  }
}

module.exports = Choice
