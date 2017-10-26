const Status = require('../Status')
const boom = require('boom')

const NotSet = 'NotSet'
function pOrC (promise, callback) {
  if (callback === NotSet) { return promise }
  promise
    .then(result => callback(null, result))
    .catch(err => callback(err, null))
} // pOrC

class Dao {
  /// /////////////////////////
  /// Public interface
  createNewExecution (startAt, startResource, input, stateMachineName, executionOptions, callback = NotSet) {
    return pOrC(
      this._createNewExecution(startAt, startResource, input, stateMachineName, executionOptions),
      callback
    )
  } // _createNewExecution

  stopExecution (cause, errorCode, executionName, executionOptions, callback = NotSet) {
    return pOrC(
      this._stopExecution(cause, errorCode, executionName, executionOptions),
      callback
    )
  } // stopExecution

  findExecutionByName (executionName, callback = NotSet) {
    return pOrC(
      this._findExecution(executionName),
      callback
    )
  } // findExecutionByName

  succeedExecution (executionName, ctx, callback = NotSet) {
    return pOrC(
      this._succeedExecution(executionName, ctx),
      callback
    )
  } // succeedExecution

  failExecution (executionDescription, errorMessage, errorCode, callback = NotSet) {
    return pOrC(
      this._failExecution(executionDescription, errorMessage, errorCode),
      callback
    )
  } // failExecution

  setNextState (executionName, nextStateName, nextResource, ctx, callback = NotSet) {
    return pOrC(
      this._setNextState(executionName, nextStateName, nextResource, ctx),
      callback
    )
  } // setNextState

  updateCurrentStateName (stateName, currentResource, executionName, callback = NotSet) {
    return pOrC(
      this._updateCurrentStateName(stateName, currentResource, executionName),
      callback
    )
  } // updateCurrentStateName

  /// //////////////////////
  /// Implementation
  _createNewExecution (startAt, startResource, input, stateMachineName, executionOptions) {
    const executionName = this._newExecutionName(stateMachineName)
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

    return this._createExecution(executionDescription)
  } // _createNewExecution

  _stopExecution (cause, errorCode, executionName, executionOptions) {
    return this._updateExecution(
      executionName,
      execution => {
        execution.status = Status.STOPPED
        execution.errorCause = execution.errorCause || cause
        execution.errorCode = execution.errorCode || errorCode
      },
      boom.badRequest(`Unable to stop execution with name '${executionName}'`)
    )
  } // _stopExecution

  _succeedExecution (executionName, ctx) {
    return this._updateExecution(
      executionName,
      execution => {
        execution.status = Status.SUCCEEDED
        execution.ctx = ctx
      },
      boom.badRequest(`Unable to succeed execution with name '${executionName}'`)
    )
  } // _succeedExecution

  _failExecution (executionDescription, errorMessage, errorCode) {
    const executionName = executionDescription.executionName

    return this._updateExecution(
      executionName,
      execution => {
        execution.status = Status.FAILED
        execution.errorCode = errorCode
        execution.errorMessage = errorMessage

        return this._markRelatedBranchesAsFailed(executionDescription.rootExecutionName)
      },
      boom.badRequest(`Unable to fail execution with name '${executionName}'`)
    )
  } // _failExecution

  _markRelatedBranchesAsFailed (executionName) {
    if (!executionName) {
      return
    }

    return this._updateExecution(
      executionName,
      execution => {
        execution.status = Status.FAILED
        execution.errorCause = execution.errorCause || 'States.BranchFailed'
        execution.errorCode = execution.errorCode || 'Failed because a state in a parallel branch has failed'
      },
      boom.badRequest(`Unable to set failed state for execution named ${executionName}`)
    )
  } // _markRelatedBrancesAsFailed

  _setNextState (executionName, nextStateName, nextResource, ctx) {
    return this._updateExecution(
      executionName,
      execution => {
        execution.ctx = ctx
        execution.currentStateName = nextStateName
        execution.currentResource = nextResource
      },
      boom.badRequest(`Unable to set next state name for execution with name '${executionName}'`)
    )
  } // _setNextState

  _updateCurrentStateName (stateName, currentResource, executionName) {
    return this._updateExecution(
      executionName,
      execution => {
        execution.currentStateName = stateName
        execution.currentResource = currentResource
      },
      boom.badRequest(`Unable to update state name for execution with name '${executionName}'`)
    )
  } // _updateCurrentStateName

  /// ///////////
  /// subclass provides
  /// _newExecutionName (stateMachineName) -> string
  /// async _findExecution (executionName) -> execution
  /// async _updateExecution (executionName, updateFn, errorMsg) -> execution
  /// async _createExecution (execution) -> execution
} // class Dao

module.exports = Dao
