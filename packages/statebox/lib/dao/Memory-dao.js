const process = require('process')
const _ = require('lodash')
const Dao = require('./Dao')
const Status = require('../Status')

class MemoryDao extends Dao {
  constructor (options) {
    super()
    this.uuid = 0
    this.executions = {}
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

  /// ////////////////////////////////////
  _newExecutionName (stateMachineName) {
    this.uuid++
    return this.uuid.toString()
  } // newExecutionName

  async _findExecution (executionName) {
    return this.executions[executionName]
  } // _findExecution

  async _updateExecution (executionName, updateFn, error) {
    const execution = this.executions[executionName]

    if (!execution) {
      throw error
    }

    updateFn(execution)

    this._saveExecution(execution)

    return execution
  } // _updateExecution

  async _createExecution (execution) {
    return this._saveExecution(execution)
  } // _createExecution

  async _saveExecution (execution) {
    if (!execution) {
      return
    }

    this.executions[execution.executionName] = execution

    return execution
  } // _saveExecution
} // class MemoryDao

module.exports = MemoryDao
