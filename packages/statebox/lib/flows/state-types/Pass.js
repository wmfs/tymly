'use strict'
const BaseStateType = require('./Base-state')
const convertJsonpathToDottie = require('./../../utils/convert-jsonpath-to-dottie')

class Pass extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition, options)
    this.stateType = 'Pass'
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
