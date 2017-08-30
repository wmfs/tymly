'use strict'
const BaseStateType = require('./Base-state')

class Fail extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition, options)
    this.stateType = 'Fail'
    this.debug()
  }
}

module.exports = Fail
