'use strict'
const BaseStateType = require('./Base-state')

class Wait extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, options)
    this.stateType = 'Wait'
    this.debug()
  }
}

module.exports = Wait
