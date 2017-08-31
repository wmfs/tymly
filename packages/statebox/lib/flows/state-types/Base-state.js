'use strict'
const debugPackage = require('debug')('statebox')
const flows = require('./../../flows')
const getExecutionDescription = require('./../../utils/get-execution-description')
const boom = require('boom')

// https://states-language.net/spec.html#task-state
// "REFERENCE PATH"
// dottie!
const dottie = require('dottie')

class BaseState {
  constructor (stateName, flow, stateDefinition, options) {
    this.name = stateName
    this.flow = flow
    this.flowName = flow.flowName
    this.definition = stateDefinition
    this.options = options
    this.schemaName = this.options.schemaName
    this.client = this.options.client
    this.endSql = `UPDATE ${this.schemaName}.current_executions SET status='SUCCEEDED', context=$1 WHERE execution_name=$2`
    this.failSql = `UPDATE ${this.schemaName}.current_executions SET status='FAILED',error_cause=$1, error_code=$2 WHERE execution_name=$3`
    this.nextSql = `UPDATE ${this.schemaName}.current_executions SET current_state_name=$1, context=$2 WHERE execution_name=$3`
    this.updateStateSql = `UPDATE ${this.schemaName}.current_executions SET current_state_name=$1 WHERE execution_name=$2`
  }

  debug () {
    debugPackage(` - Created '${this.name}' ${this.stateType} within flow '${this.flowName}'`)
  }

  updateCurrentStateName (nextStateName, executionName) {
    const _this = this
    if (nextStateName) {
      this.client.query(
        this.updateStateSql,
        [
          nextStateName,
          executionName
        ],
        function (err) {
          if (err) {
            // TODO: Needs handling as per spec
            throw (err)
          } else {
            _this.flow.processState(executionName)
          }
        }
      )
    } else {
      // TODO: No destination state... needs to behave as per the spec
      throw boom.badRequest(`No next-state available in flow ${_this.flowName} (executionName=${executionName})`)
    }
  }

  processTaskFailure (options, executionName) {
    const _this = this
    this.client.query(
      this.failSql,
      [
        options.cause,
        options.error,
        executionName
      ],
      function (err) {
        if (err) {
          // TODO: Needs handling as per spec
          throw (err)
        } else {
          _this.flow.processState(executionName)
        }
      }
    )
  }

  processTaskSuccess (output, executionName) {
    const _this = this
    getExecutionDescription.findByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          // TODO: Handle this as per spec!
          throw (err)
        } else {
          let ctx = executionDescription.input
          if (output) {
            dottie.set(ctx, _this.resultPath, output)
          }
          const flow = flows.findFlowByName(executionDescription.flowName)
          const stateDefinition = flow.findStateDefinitionByName(executionDescription.currentStateName)

          // END
          if (stateDefinition.End) {
            _this.client.query(
              _this.endSql,
              [
                ctx,
                executionName
              ],
              function (err) {
                if (err) {
                  // TODO: Needs handling as per spec
                  throw (err)
                }
              }
            )
          } else {
            // NEXT
            const nextStateName = stateDefinition.Next
            executionDescription.currentStateName = nextStateName
            _this.client.query(
              _this.nextSql,
              [
                nextStateName,
                ctx,
                executionName
              ],
              function (err) {
                if (err) {
                  // TODO: Needs handling as per spec
                  throw (err)
                } else {
                  flow.processState(executionName)
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
