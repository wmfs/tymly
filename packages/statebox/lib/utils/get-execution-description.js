'use strict'
const boom = require('boom')

class GetExecutionDescription {
  applyOptions (options) {
    this.client = options.client
    this.sql =
      'SELECT execution_name, status, current_state_name, flow_name, context, _created ' +
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
            callback(
              null,
              {
                executionName: executionName,
                input: result.rows[0].context,
                currentStateName: result.rows[0].current_state_name,
                flowName: result.rows[0].flow_name,
                status: result.rows[0].status,
                startDate: result.rows[0]._created
              }
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
