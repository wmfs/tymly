'use strict'
const BaseStateType = require('./Base-state')
const convertJsonpathToDottie = require('./../../utils/convert-jsonpath-to-dottie')

class Pass extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, 'Pass', options)
    this.resultPath = convertJsonpathToDottie(stateDefinition.ResultPath, '')
    this.result = stateDefinition.Result
    this.debug()
  }

  process (executionDescription) {
    this.processTaskSuccess(
      this.result,
      executionDescription.executionName
    )
  }
}

module.exports = Pass
