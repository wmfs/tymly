'use strict'
const boom = require('boom')
const _ = require('lodash')

class GetExecutionDescription {
  applyOptions (options) {
    this.client = options.client
    this.sql =
      'SELECT execution_name, status, current_state_name, flow_name, context, parent_execution_name, root_execution_name, _created, error_cause, error_code ' +
      `FROM ${options.schemaName}.current_executions ` +
      'WHERE execution_name = $1;'
  }

  findByName (executionName, callback) {
    this.client.query(
      this.sql,
      [executionName],
      function (err, result) {
        if (err) {
          callback(err)
        } else {
          if (result.hasOwnProperty('rows') && result.rows.length === 1) {
            const row = result.rows[0]
            const response = {
              executionName: executionName,
              parentExecutionName: row.parent_execution_name,
              rootExecutionName: row.root_execution_name,
              input: row.context,
              currentStateName: row.current_state_name,
              flowName: row.flow_name,
              status: row.status,
              startDate: row._created
            }

            if (response.status === 'FAILED') {
              if (!_.isUndefined(row.error_cause)) {
                response.errorCause = row.error_cause
              }
              if (!_.isUndefined(row.error_code)) {
                response.errorCode = row.error_code
              }
            }

            callback(
              null,
              response
            )
          } else {
            callback(
              boom.badRequest(`Unable to find execution with name ${executionName}`)
            )
          }
        }
      }
    )
  }
}

module.exports = new GetExecutionDescription()
