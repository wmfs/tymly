'use strict'
const BaseStateType = require('./Base-state')

class Parallel extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition, options)
    this.stateType = 'Parallel'
    this.debug()
  }

  process (executionDescription) {
    this.processTaskSuccess(
      undefined,
      executionDescription.executionName
    )
  }

}

module.exports = Parallel
