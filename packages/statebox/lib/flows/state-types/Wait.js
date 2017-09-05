'use strict'
const BaseStateType = require('./Base-state')

class Wait extends BaseStateType {
  constructor (stateName, flow, stateDefinition, executions, options) {
    super(stateName, flow, stateDefinition, executions, options)
    this.stateType = 'Wait'
    this.debug()
  }
}

module.exports = Wait
