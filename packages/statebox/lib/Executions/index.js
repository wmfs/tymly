'use strict'

const flows = require('./../flows')
const boom = require('boom')

class Executions {
  constructor (options) {
    this.client = options.client
    this.schemaName = options.schemaName
  }

  start (input, flowName, parentExecutionName, rootExecutionName, callback) {
    // References
    //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_StartExecution.html
    //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html
    // TODO: Test 'input' conforms
    // TODO: Note API usually requires a string, but object seems better for Statebox?

    const flowToExecute = flows.findFlowByName(flowName)
    if (flowToExecute) {
      const sql = `INSERT INTO ${this.schemaName}.current_executions (flow_name, context, current_state_name,parent_execution_name, root_execution_name) VALUES ($1, $2, $3, $4, $5) RETURNING execution_name, status, _created;`
      this.client.query(
        sql,
        [
          flowName, // $1 (flow_name)
          input, // $2 (context)
          flowToExecute.startAt, // $3 (current_state_name)
          parentExecutionName, // $4
          rootExecutionName // $5
        ],
        function (err, info) {
          if (err) {
            // TODO: Rollback (and test the rollback worked too) but don't close connection.
            callback(err)
          } else {
            const executionName = info.rows[0].execution_name
            const executionDescription = {
              executionName: executionName,
              input: input,
              currentStateName: flowToExecute.startAt,
              flowName: flowName,
              status: info.rows[0].status,
              startDate: info.rows[0]._created
            }
            flowToExecute.processState(executionName)
            callback(
              null,
              executionDescription
            )
          }
        }
      )
    } else {
      // No Flow!
      callback(
        boom.badRequest(
          `Unknown Flow with name '${flowName}'`,
          flowName
        )
      )
    }
  }
}

module.exports = Executions
