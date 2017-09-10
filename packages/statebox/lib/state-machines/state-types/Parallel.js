'use strict'
const _ = require('lodash')
const BaseStateType = require('./Base-state')
const async = require('async')

class Parallel extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, options)
    const _this = this
    this.stateType = 'Parallel'
    this.branches = []
    stateDefinition.Branches.forEach(
      function (branchDefinition) {
        const parts = stateMachine.name.split(':')
        const stateMachineName = parts[0] + ':' + branchDefinition.StartAt
        _this.branches.push(stateMachineName)
      }
    )
    this.debug()
  }

  process (executionDescription) {
    const _this = this
    const rootExecutionName = executionDescription.rootExecutionName || executionDescription.executionName
    async.each(
      this.branches,
      function (stateMachineName, cb) {
        _this.options.executioner(
          _.cloneDeep(executionDescription.ctx),
          stateMachineName,
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
