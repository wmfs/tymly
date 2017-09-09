'use strict'
const BaseStateType = require('./Base-state')
const aslChoiceProcessor = require('asl-choice-processor')

class Choice extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition, options)
    this.stateType = 'Choice'
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
