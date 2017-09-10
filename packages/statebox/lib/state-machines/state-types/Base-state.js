'use strict'
const debugPackage = require('debug')('statebox')
const stateMachines = require('./../../state-machines')
const _ = require('lodash')
const dottie = require('dottie')

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

  processTaskFailure (options, executionName) {
    const _this = this
    this.options.dao.findExecutionByName(
      executionName,
      function (err) {
        if (err) {
          // TODO: Handle this as per spec!
          throw (err)
        } else {
          _this.options.dao.failExecution(
            executionName,
            options.cause,
            options.error,
            function (err) {
              if (err) {
                throw new Error(err)
              }
            }
          )
        }
      }
    )
  }

  processEndOfBranch (parentExecutionName, ctx, executionDescription) {
    const _this = this
    this.options.dao.getBranchSummary(
      parentExecutionName,
      function (err, summary) {
        if (err) {
          // TODO: Not sure?
          throw new Error(err)
        } else {
          if (summary) {
            if (summary.numberOfBranches === summary.numberSucceeded) {
              debugPackage(`All ${summary.number_of_branches} branches have now succeeded (executionName='${parentExecutionName}')`)
              _this.processTaskSuccess(ctx, parentExecutionName)
            } else if (summary.numberFailed > 0) {
              debugPackage(`At least one of the ${summary.numberOfBranches} branches has failed (executionName='${parentExecutionName}'). Marking all related branches as FAILED.`)
              _this.options.dao.markRelatedBranchesAsFailed(
                parentExecutionName,
                'States.BranchFailed',
                'Failed because a state in a parallel branch has failed',
                function (err) {
                  if (err) {
                    // TODO: Not Sure?
                    throw new Error(err)
                  }
                }
              )
            }
          }
        }
      }
    )
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
          let ctx = executionDescription.ctx
          if (output) {
            if (_this.resultPath) {
              dottie.set(ctx, _this.resultPath, output)
            } else {
              ctx = _.defaults(output, ctx)
            }
          }
          const stateMachine = stateMachines.findStateMachineByName(executionDescription.stateMachineName)
          const stateDefinition = stateMachine.findStateDefinitionByName(executionDescription.currentStateName)

          // END
          if (stateDefinition.End) {
            _this.options.dao.succeedExecution(
              executionName,
              ctx,
              function (err) {
                if (err) {
                  // TODO: Needs handling as per spec
                  throw new Error(err)
                } else {
                  if (executionDescription.parentExecutionName) {
                    _this.processEndOfBranch(executionDescription.parentExecutionName, ctx, executionDescription)
                  }
                }
              }
            )
          } else {
            // NEXT
            _this.options.dao.setNextState(
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
      }
    )
  }
}

module.exports = BaseState
