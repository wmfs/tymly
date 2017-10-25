const boom = require('boom')

const executionModelDefinition = {
  'id': 'execution',
  'name': 'executions',
  'namespace': 'tymly',
  'plural': 'executions',
  'primaryKey': ['executionName'],
  'description': 'Statebox executions instances',
  'type': 'object',
  'properties': {
    'executionName': {
      'type': 'string'
    },
    'ctx': {
      'type': 'string'
    },
    'currentStateName': {
      'type': 'string'
    },
    'currentResource': {
      'type': 'string'
    },
    'stateMachineName': {
      'type': 'string'
    },
    'status': {
      'type': 'string'
    },
    'instigatingClient': {
      'type': 'string'
    },
    'parentExecutionName': {
      'type': 'string'
    },
    'rootExecutionName': {
      'type': 'string'
    }
  },
  'required': ['uuid']
} // executionModelDefinition

const NotSet = 'NotSet'
function pOrC (promise, callback) {
  if (callback === NotSet) { return promise }
  promise
    .then(result => callback(null, result))
    .catch(err => callback(err, null))
} // pOrC

class StorageServiceDao {
  static get ExecutionModelName () {
    return `${executionModelDefinition.namespace}_${executionModelDefinition.id}`
  } // ExecutionModelName
  static get ExecutionModelDefinition () {
    return executionModelDefinition
  } // ExecutionModelDefinition

  constructor (model) {
    this.uuid = 0
    this.model = model
  } // constructor

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
      this.model.findById(executionName),
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

  /// /////////////////////////////////
  async _createNewExecution (startAt, startResource, input, stateMachineName, executionOptions) {
    this.uuid++
    const executionName = this.uuid.toString()
    const executionDescription = {
      executionName: executionName,
      ctx: input,
      currentStateName: startAt,
      currentResource: startResource,
      stateMachineName: stateMachineName,
      status: 'RUNNING',
      instigatingClient: executionOptions.instigatingClient,
      parentExecutionName: executionOptions.parentExecutionName,
      rootExecutionName: executionOptions.rootExecutionName,
      startDate: new Date().toISOString()
    }

    await this.model.create(executionDescription, {})

    return executionDescription
  } // _createNewExecution

  _stopExecution (cause, errorCode, executionName, executionOptions) {
    return this._updateExecution(
      executionName,
      execution => {
        execution.status = 'STOPPED'
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
        execution.status = 'SUCCEEDED'
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
        execution.status = 'FAILED'
        execution.errorCode = errorCode
        execution.errorMessage = errorMessage

        return this._markRelatedBranchesAsFailed(executionDescription.rootExecutionName)
      },
      boom.badRequest(`Unable to fail execution with name '${executionName}'`)
    )
  } // _failExecution

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

  _markRelatedBranchesAsFailed (executionName) {
    if (!executionName) {
      return
    }

    return this._updateExecution(
      executionName,
      execution => {
        execution.status = 'FAILED'
        execution.errorCause = execution.errorCause || 'States.BranchFailed'
        execution.errorCode = execution.errorCode || 'Failed because a state in a parallel branch has failed'
      },
      boom.badRequest(`Unable to set failed state for execution named ${executionName}`)
    )
  } // _markRelatedBrancesAsFailed

  /// ////////////////////////////////
  async _updateExecution (executionName, updateFn, error) {
    const execution = await this.findExecutionByName(executionName)

    if (!execution) {
      throw error
    }

    await updateFn(execution)

    await this._saveExecution(execution)

    return execution
  } // _updateExecution

  async _saveExecution (execution) {
    if (!execution) {
      return
    }

    await this.model.update(execution, {})

    return execution
  } // _saveExecution
} // class StorageServiceDao

module.exports = StorageServiceDao
