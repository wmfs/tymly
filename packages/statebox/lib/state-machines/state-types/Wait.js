'use strict'
const BaseStateType = require('./Base-state')
const debug = require('debug')('statebox')
const process = require('process')
const convertJsonpathToDottie = require('./../../utils/convert-jsonpath-to-dottie')

/* https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-wait-state.html */
class Context {
  constructor (executionDescription, task) {
    this.executionName = executionDescription.executionName
    this.executionOptions = executionDescription.executionOptions
    this.userId = executionDescription.executionOptions.userId
    this.task = task
  }

  sendTaskSuccess (output) {
    debug(`sendTaskSuccess(${this.executionName})`)
    this.task.processTaskSuccess(output, this.executionName)
  }

  sendTaskFailure (options) {
    debug(`sendTaskFailure(${this.executionName})`)
    this.task.processTaskFailure(options, this.executionName)
  }

  sendTaskHeartbeat (output, callback) {
    debug(`sendTaskHeartbeat(${this.executionName})`)
    if (!callback) {
      console.log(new Error('Missing callback parameter in call to sendTaskHeartbeat'))
      callback = () => {}
    }
    this.task.processTaskHeartbeat(output, this.executionName, callback)
  }
}

class Wait extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, options)
    this.stateMachine = stateMachine
    this.options = options
    this.inputPath = stateDefinition.InputPath || '$'
    this.resultPath = convertJsonpathToDottie(stateDefinition.ResultPath)
    this.timeout = stateDefinition.Seconds
  }

  process (executionDescription) {
    const context = new Context(executionDescription, this)
    this.timeout *= 1000

    process.nextTick(
      () => {
        try {
          setTimeout(() => {
            context.sendTaskSuccess('', executionDescription.executionName)
          }, this.timeout)
        } catch (e) {
          console.error(
            '\nUNHANDLED EXCEPTION WHILE PROCESSING WAIT ------------------------------------\n' +
            `error: ${e}\n` +
            `executionName: ${executionDescription.executionName}\n` +
            `stateMachineName: ${executionDescription.stateMachineName}\n` +
            `currentStateName: ${executionDescription.currentStateName}\n` +
            `parentExecutionName: ${executionDescription.executionOptions.parentExecutionName}\n` +
            `rootExecutionName: ${executionDescription.executionOptions.rootExecutionName}\n` +
            `startDate: ${executionDescription.startDate}\n` +
            `ctx: ${JSON.stringify(executionDescription.ctx)}\n\n` +
            'STACK\n' +
            '-----\n' +
            e.stack + '\n' +
            '------------------------------------------------------------------------------\n'
          )
          // TODO: Sending out error details might leak security info... implement "dev mode" flag?
          this.processTaskFailure(
            {
              error: 'States.WaitFail',
              cause: e.toString()
            },
            executionDescription.executionName
          )
        }
      }
    )
  }
}

module.exports = Wait
