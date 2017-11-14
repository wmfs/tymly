const uuid = require('uuid/v1')
const Dao = require('./Dao')

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
      'type': 'object'
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
    'executionOptions': {
      'type': 'object'
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

class StorageServiceDao extends Dao {
  static get ExecutionModelName () {
    return `${executionModelDefinition.namespace}_${executionModelDefinition.id}`
  } // ExecutionModelName
  static get ExecutionModelDefinition () {
    return executionModelDefinition
  } // ExecutionModelDefinition

  constructor (model) {
    super()
    this.count = 0
    this.model = model
  } // constructor

  /// ////////////////////////////////
  _newExecutionName (stateMachineName) {
    return `${stateMachineName}-${uuid()}-${++this.count}`
  } // newExecutionName

  async _findExecution (executionName) {
    const execution = await this.model.findById(executionName)
    return execution
  } // _findExecution

  async _updateExecution (executionName, updateFn, error) {
    const execution = await this._findExecution(executionName)

    if (!execution) {
      throw error
    }

    updateFn(execution)

    return this._saveExecution(execution)
  } // _updateExecution

  async _createExecution (execution) {
    return this._persist('create', execution)
  } // _createExecution

  async _saveExecution (execution) {
    return this._persist('update', execution)
  } // _saveExecution

  async _persist (action, execution) {
    if (!execution) {
      return
    }

    const ctx = execution.ctx
    await this.model[action](execution, {})

    execution.ctx = ctx
    return execution
  } // _saveExecution
} // class StorageServiceDao

module.exports = StorageServiceDao
