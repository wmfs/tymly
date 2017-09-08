'use strict'
const debugPackage = require('debug')('statebox')
const flows = require('./../../flows')
const getExecutionDescription = require('./../../utils/get-execution-description')
const boom = require('boom')
const _ = require('lodash')

// https://states-language.net/spec.html#task-state
// "REFERENCE PATH"
// dottie!
const dottie = require('dottie')

class BaseState {
  constructor (stateName, flow, stateDefinition, executions, options) {
    this.name = stateName
    this.flow = flow
    this.flowName = flow.name
    this.definition = stateDefinition
    this.options = options
    this.schemaName = this.options.schemaName
    this.client = this.options.client
    this.endSql = `UPDATE ${this.schemaName}.current_executions SET status='SUCCEEDED', context=$1 WHERE execution_name=$2`
    this.failSql = `UPDATE ${this.schemaName}.current_executions SET status='FAILED',error_cause=$1, error_code=$2 WHERE execution_name=$3`
    this.nextSql = `UPDATE ${this.schemaName}.current_executions SET current_state_name=$1, context=$2 WHERE execution_name=$3`
    this.updateStateSql = `UPDATE ${this.schemaName}.current_executions SET current_state_name=$1 WHERE execution_name=$2`
    this.branchSql = `SELECT SUM(1) number_of_branches, SUM(CASE WHEN status='SUCCEEDED' THEN 1 ELSE 0 END) number_succeeded, SUM(CASE WHEN status='FAILED' THEN 1 ELSE 0 END) number_failed from ${this.schemaName}.current_executions where parent_execution_name = $1`
    this.markRelatedBranchesAsFailed = `UPDATE ${this.schemaName}.current_executions SET status='FAILED', error_cause = COALESCE(error_cause, $1), error_code=COALESCE(error_code, $2) WHERE execution_name = $3`
  }

  debug () {
    debugPackage(` - Created '${this.name}' ${this.stateType} within flow '${this.flow.name}'`)
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
    getExecutionDescription.findByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          // TODO: Handle this as per spec!
          throw (err)
        } else {
          _this.client.query(
            _this.failSql,
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
                // Finished this, but was it part of a parallel branch?
                if (executionDescription.parentExecutionName) {
                  _this.processEndOfBranch(executionDescription.parentExecutionName, null, executionDescription)
                }
              }
            }
          )
        }
      }
    )
  }

  processEndOfBranch (parentExecutionName, ctx, executionDescription) {
    const _this = this
    this.client.query(
      this.branchSql,
      [parentExecutionName],
      function (err, result) {
        if (err) {
          // TODO: Not sure?
          throw new Error(err)
        } else {
          if (result.rowCount === 1) {
            const summary = result.rows[0]
            if (summary.number_of_branches === summary.number_succeeded) {
              debugPackage(`All ${summary.number_of_branches} branches have now succeeded (executionName='${parentExecutionName}')`)
              _this.processTaskSuccess(ctx, parentExecutionName)
            } else if (summary.number_failed > 0) {
              debugPackage(`At least one of the ${summary.number_of_branches} branches has failed (executionName='${parentExecutionName}'). Marking all related branches as FAILED.`)
              _this.client.query(
                _this.markRelatedBranchesAsFailed,
                [
                  'States.BranchFailed',
                  'Failed because a state in a parallel branch has failed',
                  parentExecutionName
                ],
                function (err) {
                  if (err) {
                    // TODO: Not Sure?
                  }
                }
              )
            }
          } else {
            // TODO: Not Sure?
          }
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
            if (_this.resultPath) {
              dottie.set(ctx, _this.resultPath, output)
            } else {
              ctx = _.defaults(output, ctx)
            }
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
                } else {
                  // Finished this, but was it part of a parallel branch?
                  if (executionDescription.parentExecutionName) {
                    _this.processEndOfBranch(executionDescription.parentExecutionName, ctx, executionDescription)
                  }
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
