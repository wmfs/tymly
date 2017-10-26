const process = require('process')
const boom = require('boom')
const _ = require('lodash')
const Status = require('../Status')

class MemoryDao {
  constructor (options) {
    this.uuid = 0
    this.executions = {}
  }

  createNewExecution (startAt, startResource, input, stateMachineName, executionOptions, callback) {
    this.uuid++
    const executionName = this.uuid.toString()
    const executionDescription = {
      executionName: executionName,
      ctx: input,
      currentStateName: startAt,
      currentResource: startResource,
      stateMachineName: stateMachineName,
      status: Status.RUNNING,
      instigatingClient: executionOptions.instigatingClient,
      parentExecutionName: executionOptions.parentExecutionName,
      rootExecutionName: executionOptions.rootExecutionName,
      startDate: new Date().toISOString()
    }
    this.executions[executionName] = executionDescription
    process.nextTick(
      function () {
        callback(null, executionDescription)
      }
    )
  }

  stopExecution (cause, errorCode, executionName, executionOptions, callback) {
    const _this = this
    process.nextTick(
      function () {
        const execution = _this.executions[executionName]
        if (execution) {
          execution.status = Status.STOPPED
          if (!execution.errorCause) {
            execution.errorCause = cause
          }
          if (!execution.errorCode) {
            execution.errorCode = errorCode
          }
          callback(null)
        } else {
          // TODO: Something bad happened
          callback(boom.badRequest(`Unable to update state name for execution with name '${executionName}'`))
        }
      }
    )
  }

  findExecutionByName (executionName, callback) {
    const _this = this
    process.nextTick(
      function () {
        const raw = _this.executions[executionName]
        if (raw) {
          callback(
            null,
            raw
          )
        } else {
          callback(null, null)
        }
      }
    )
  }

  succeedExecution (executionName, ctx, callback) {
    const _this = this
    process.nextTick(
      function () {
        const execution = _this.executions[executionName]
        if (execution) {
          execution.ctx = ctx
          execution.status = Status.SUCCEEDED
          callback(null, execution)
        } else {
          // TODO: Something bad happened
          callback(boom.badRequest(`Unable to succeed execution with name '${executionName}'`))
        }
      }
    )
  }

  failExecution (executionDescription, errorMessage, errorCode, callback) {
    const _this = this
    process.nextTick(
      function () {
        const executionName = executionDescription.executionName
        const execution = _this.executions[executionName]
        if (execution) {
          execution.status = Status.FAILED
          execution.errorCode = errorCode
          execution.errorMessage = errorMessage
          if (executionDescription.hasOwnProperty('rootExecutionName') && executionDescription.rootExecutionName) {
            _this.markRelatedBranchesAsFailed(
              executionDescription.rootExecutionName,
              function (err) {
                if (err) {
                  callback(err)
                } else {
                  callback(null, execution)
                }
              }
            )
          } else {
            callback(null, execution)
          }
        } else {
          // TODO: Something bad happened
          callback(boom.badRequest(`Unable to fail execution with name '${executionName}'`))
        }
      }
    )
  }

  setNextState (executionName, nextStateName, nextResource, ctx, callback) {
    const _this = this
    process.nextTick(
      function () {
        const execution = _this.executions[executionName]
        if (execution) {
          execution.ctx = ctx
          execution.currentStateName = nextStateName
          execution.currentResource = nextResource
          callback(null)
        } else {
          // TODO: Something bad happened
          callback(boom.badRequest(`Unable to set next state name for execution with name '${executionName}'`))
        }
      }
    )
  }

  updateCurrentStateName (stateName, currentResource, executionName, callback) {
    const _this = this
    process.nextTick(
      function () {
        const execution = _this.executions[executionName]
        if (execution) {
          execution.currentStateName = stateName
          execution.currentResource = currentResource
          callback(null)
        } else {
          // TODO: Something bad happened
          callback(boom.badRequest(`Unable to update state name for execution with name '${executionName}'`))
        }
      }
    )
  }

  getBranchSummary (parentExecutionName, callback) {
    const _this = this
    process.nextTick(
      function () {
        const summary = {
          numberOfBranches: 0,
          numberSucceeded: 0,
          numberFailed: 0
        }
        _.forOwn(
          _this.executions,
          function (execution) {
            if (execution.hasOwnProperty('parentExecutionName') && execution.parentExecutionName === parentExecutionName) {
              summary.numberOfBranches++
              switch (execution.status) {
                case Status.SUCCEEDED:
                  summary.numberSucceeded++
                  break

                case Status.FAILED:
                  summary.numberFailed++
                  break
              }
            }
          }
        )
        callback(null, summary)
      }
    )
  }

  markRelatedBranchesAsFailed (executionName, callback) {
    const _this = this
    process.nextTick(
      function () {
        const execution = _this.executions[executionName]
        if (execution) {
          execution.status = Status.FAILED
          if (!execution.errorCause) {
            execution.errorCause = 'States.BranchFailed'
          }
          if (!execution.errorCode) {
            execution.errorCode = 'Failed because a state in a parallel branch has failed'
          }
          callback(null)
        } else {
          // TODO: Something bad happened
          callback(boom.badRequest(`Unable to set next state name for execution with name '${executionName}'`))
        }
      }
    )
  }
}

module.exports = MemoryDao
