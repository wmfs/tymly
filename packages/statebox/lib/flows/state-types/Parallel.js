'use strict'
const _ = require('lodash')
const BaseStateType = require('./Base-state')
const async = require('async')

class Parallel extends BaseStateType {
  constructor (stateName, flow, stateDefinition, options) {
    super(stateName, flow, stateDefinition, options)
    const _this = this
    this.stateType = 'Parallel'
    this.branches = []
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
    const _this = this
    const rootExecutionName = executionDescription.rootExecutionName || executionDescription.executionName
    async.each(
      this.branches,
      function (flowName, cb) {
        _this.options.executioner(
          _.cloneDeep(executionDescription.ctx),
          flowName,
          {
            parentExecutionName: executionDescription.executionName,
            rootExecutionName: rootExecutionName
          },
          _this.options,
          executionDescription.rootExecutionName || executionDescription.executionName,
          cb
        )
      },
      function (err) {
        if (err) {
          // TODO: Needs handling!
          throw new Error(err)
        }
      }
    )
  }
}

module.exports = Parallel
