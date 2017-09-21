'use strict'
const debugPackage = require('debug')('statebox')
const stateMachines = require('./../../state-machines')
const _ = require('lodash')
const dottie = require('dottie')
const callbackManager = require('./../../callback-manager')

class BaseState {
  constructor (stateName, stateMachine, stateDefinition, options) {
    this.name = stateName
    this.stateMachine = stateMachine
    this.stateMachineName = stateMachine.name
    this.definition = stateDefinition
    this.options = options
  }

  debug () {
    debugPackage(` - Created '${this.name}' ${this.stateType} within stateMachine '${this.stateMachine.name}'`)
  }

  updateCurrentStateName (nextStateName, executionName) {
    const _this = this
    this.options.dao.updateCurrentStateName(
      nextStateName,
      executionName,
      function (err) {
        if (err) {
          // TODO: Needs handling as per spec
          throw new Error(err)
        } else {
          _this.stateMachine.processState(executionName)
        }
      }
    )
  }

  runTaskFailure (executionDescription, options, callback) {
    const executionName = executionDescription.executionName
    const tracker = this.options.parallelBranchTracker
    tracker.registerChildExecutionFail(executionName)
    this.options.dao.failExecution(
      executionDescription,
      options.cause,
      options.error,
      function (err, failedExecutionDescription) {
        if (err) {
          callback(err)
        } else {
          callback(null, failedExecutionDescription)
        }
      }
    )
  }

  processTaskFailure (options, executionName) {
    const _this = this
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          // TODO: Handle this as per spec!
          throw (err)
        } else {
          _this.runTaskFailure(
            executionDescription,
            options,
            function (err, failedExecutionDescription) {
              if (err) {
                throw new Error(err)
              } else {
                const registeredCallback = callbackManager.getAndRemoveCallback('onCompletion', executionName)
                if (registeredCallback) {
                  registeredCallback(null, failedExecutionDescription)
                }
              }
            }
          )
        }
      }
    )
  }

  runTaskSuccess (executionDescription, output) {
    const _this = this
    const executionName = executionDescription.executionName
    let ctx = executionDescription.ctx
    if (output) {
      if (this.resultPath) {
        dottie.set(ctx, this.resultPath, output)
      } else {
        ctx = _.defaults(output, ctx)
      }
    }
    const stateMachine = stateMachines.findStateMachineByName(executionDescription.stateMachineName)
    const stateDefinition = stateMachine.findStateDefinitionByName(executionDescription.currentStateName)

    // END
    if (stateDefinition.End) {
      this.options.dao.succeedExecution(
        executionName,
        ctx,
        function (err, succeededExecutionDescription) {
          if (err) {
            // TODO: Needs handling as per spec
            throw new Error(err)
          } else {
            const parentExecutionName = executionDescription.parentExecutionName
            if (parentExecutionName) {
              // Has a parent flow, so see if the related parallel state can advance
              const tracker = _this.options.parallelBranchTracker
              tracker.registerChildExecutionEnd(executionDescription.executionName)
              const parallelStateStatus = tracker.getParallelTaskStatus(parentExecutionName)
              if (parallelStateStatus === 'SUCCEEDED') {
                debugPackage(`All branches have now succeeded (executionName='${executionDescription.parentExecutionName}')`)
                _this.processTaskSuccess(ctx, parentExecutionName)
              }
            } else {
              // No branching, so finished everything... might need to call a callback?
              const registeredCallback = callbackManager.getAndRemoveCallback('onCompletion', executionName)
              if (registeredCallback) {
                registeredCallback(null, succeededExecutionDescription)
              }
            }
          }
        }
      )
    } else {
      // NEXT
      this.options.dao.setNextState(
        executionName,
        stateDefinition.Next,
        ctx,
        function (err) {
          if (err) {
            // TODO: Needs handling as per spec
            throw new Error(err)
          } else {
            stateMachine.processState(executionName)
          }
        }
      )
    }
  }

  processTaskSuccess (output, executionName) {
    const _this = this
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          // TODO: Handle this as per spec!
          throw new Error(err)
        } else {
          _this.runTaskSuccess(executionDescription, output)
        }
      }
    )
  }
}

module.exports = BaseState
