'use strict'
const BaseStateType = require('./Base-state')

class Pass extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition, options)
    this.stateType = 'Pass'
    this.debug()
  }
}

module.exports = Pass
