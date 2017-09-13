'use strict'
const BaseStateType = require('./Base-state')

class Succeed extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, 'Succeed', options)
    this.debug()
  }
}

module.exports = Succeed
