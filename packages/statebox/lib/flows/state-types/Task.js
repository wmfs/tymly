'use strict'
const BaseStateType = require('./Base-state')
const resources = require('./../../resources')
const boom = require('boom')
const jp = require('jsonpath')
const convertJsonpathToDottie = require('./../../utils/convert-jsonpath-to-dottie')

class Task extends BaseStateType {
  constructor (stateName, flow, stateDefinition, executions, options) {
    super(stateName, flow, stateDefinition, executions, options)
    this.stateType = 'Task'
    const parts = stateDefinition.Resource.split(':')
    this.resourceType = parts[0]
    switch (this.resourceType) {
      case 'module':
        const moduleName = parts[1]
        this.Resource = resources.findModuleByName(moduleName)
        if (!this.Resource) {
          // Should be picked-up by flow validation before now
          throw (boom.badRequest(`Unable to bind Task '${stateName}' in flow '${this.flowName}' - module '${moduleName}' not found`, moduleName))
        }
        break
    }

    this.inputPath = stateDefinition.InputPath || '$'
    this.resultPath = convertJsonpathToDottie(stateDefinition.ResultPath)
    this.debug()
  }

  process (executionDescription) {
    const input = jp.value(executionDescription.input, this.inputPath)
    const runnableStateClass = new this.Resource(executionDescription.executionName, this)
    runnableStateClass.run(
      input,
      {} // TODO: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
    )
  }
}

module.exports = Task
