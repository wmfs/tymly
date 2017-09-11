'use strict'
const BaseStateType = require('./Base-state')
const resources = require('./../../resources')
const boom = require('boom')
const jp = require('jsonpath')
const convertJsonpathToDottie = require('./../../utils/convert-jsonpath-to-dottie')
const process = require('process')

// TODO: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
class Context {
  constructor (executionDescription, task) {
    this.executionName = executionDescription.executionName
    this.task = task
  }

  sendTaskSuccess (output) {
    this.task.processTaskSuccess(output, this.executionName)
  }

  sendTaskFailure (options) {
    this.task.processTaskFailure(options, this.executionName)
  }
}

class Task extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, options)
    this.stateType = 'Task'
    const parts = stateDefinition.Resource.split(':')
    this.resourceType = parts[0]
    switch (this.resourceType) {
      case 'module':
        const moduleName = parts[1]
        this.Resource = resources.findModuleByName(moduleName)
        if (!this.Resource) {
          // Should be picked-up by stateMachine validation before now
          throw (boom.badRequest(`Unable to bind Task '${stateName}' in stateMachine '${this.stateMachineName}' - module '${moduleName}' not found`, moduleName))
        }
        break
    }

    this.inputPath = stateDefinition.InputPath || '$'
    this.resultPath = convertJsonpathToDottie(stateDefinition.ResultPath)
    this.debug()
  }

  process (executionDescription) {
    const _this = this
    const input = jp.value(executionDescription.ctx, this.inputPath)
    const runnableStateClass = new this.Resource(executionDescription.executionName, this)
    const context = new Context(executionDescription, this)

    process.nextTick(
      function () {
        try {
          runnableStateClass.run(
            input,
            context
          )
        } catch (e) {
          console.error(
            '\nUNHANDLED EXCEPTION WHILE PROCESSING TASK ------------------------------------\n' +
            `error: ${e}\n` +
            `executionName: ${executionDescription.executionName}\n` +
            `stateMachineName: ${executionDescription.stateMachineName}\n` +
            `currentStateName: ${executionDescription.currentStateName}\n` +
            `parentExecutionName: ${executionDescription.parentExecutionName}\n` +
            `rootExecutionName: ${executionDescription.rootExecutionName}\n` +
            `startDate: ${executionDescription.startDate}\n` +
            `ctx: ${JSON.stringify(executionDescription.startDate)}\n` +
            '------------------------------------------------------------------------------\n'
          )
          // TODO: Sending out error details might leak security info... implement "dev mode" flag?
          _this.processTaskFailure(
            {
              error: 'States.TaskFail',
              cause: e.toString()
            },
            executionDescription.executionName
          )
        }
      }
    )
  }
}

module.exports = Task
