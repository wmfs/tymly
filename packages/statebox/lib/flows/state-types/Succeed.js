'use strict'
const BaseStateType = require('./Base-state')

class Succeed extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition)
    this.stateType = 'Succeed'
    this.debug()
  }
}

module.exports = Succeed
