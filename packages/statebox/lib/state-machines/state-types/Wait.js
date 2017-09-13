'use strict'
const BaseStateType = require('./Base-state')

class Wait extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, 'Wait', options)
    this.debug()
  }
}

module.exports = Wait
