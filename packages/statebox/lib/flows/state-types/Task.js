'use strict'
const BaseStateType = require('./Base-state')
const resources = require('./../../resources')
const boom = require('boom')
const convertJsonpathToDottie = require('./../../utils/convert-jsonpath-to-dottie')
class Task extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition, options)
    this.stateType = 'Task'
    const parts = stateDefinition.Resource.split(':')
    this.resourceType = parts[0]
    switch (this.resourceType) {
      case 'function':
        const functionName = parts[1]
        this.Resource = resources.findFunctionClassByName(functionName)
        if (!this.Resource) {
          // Should be picked-up by flow validation before now
          throw (boom.badRequest(`Unable to bind Task '${stateName}' in flow '${this.flowName}' - function '${functionName}' not found`, functionName))
        }
        break
    }

    this.inputPath = convertJsonpathToDottie(stateDefinition.InputPath, '')
    this.resultPath = convertJsonpathToDottie(stateDefinition.ResultPath, '')
    this.debug()
  }

  process (executionDescription) {
    const runnableStateClass = new this.Resource(executionDescription.executionName, this)
    runnableStateClass.run(
      executionDescription.input,
      {} // TODO: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
    )
  }
}

module.exports = Task
