'use strict'
const BaseStateType = require('./Base-state')

class Succeed extends BaseStateType {
  constructor (stateName, flow, stateDefinition, executions, options) {
    super(stateName, flow, stateDefinition, executions, options)
    this.stateType = 'Succeed'
    this.debug()
  }
}

module.exports = Succeed
