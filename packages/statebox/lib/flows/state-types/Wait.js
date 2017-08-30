'use strict'
const BaseStateType = require('./Base-state')

class Wait extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition, options)
    this.stateType = 'Wait'
    this.debug()
  }
}

module.exports = Wait
