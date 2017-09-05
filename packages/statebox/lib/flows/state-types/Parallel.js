'use strict'

const BaseStateType = require('./Base-state')
const async = require('async')

class Parallel extends BaseStateType {
  constructor (stateName, flow, stateDefinition, executions, options) {
    super(stateName, flow, stateDefinition, executions, options)
    const _this = this
    this.options = options
    this.stateType = 'Parallel'
    this.branches = []
    this.executions = executions
    stateDefinition.Branches.forEach(
      function (branchDefinition) {
        const parts = flow.name.split(':')
        const flowName = parts[0] + ':' + branchDefinition.StartAt
        _this.branches.push(flowName)
      }
    )

    this.debug()
  }

  process (executionDescription) {
    console.log('?????', executionDescription)

    const rootExecutionName = executionDescription.rootExecutionName || executionDescription.executionName

    const _this = this
    async.each(
      this.branches,
      function (flowName, cb) {
        _this.executions.start(
          executionDescription.input,
          flowName,
          executionDescription.executionName, // parentExecutionName
          rootExecutionName, // rootExecutionName
          cb
        )
      },
      function (err) {
        if (err) {
          // TODO: Needs handling!
          //throw new Error(err)
        }
      }
    )
  }

}

module.exports = Parallel
