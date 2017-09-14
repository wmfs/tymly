'use strict'
const _ = require('lodash')
const BaseStateType = require('./Base-state')
const async = require('async')

class Parallel extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, 'Parallel', options)
    const _this = this
    this.parallelBranchTracker = options.parallelBranchTracker
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
    const parentExecutionName = executionDescription.executionName
    const rootExecutionName = executionDescription.rootExecutionName || executionDescription.executionName
    this.parallelBranchTracker.addParentExecutionName(parentExecutionName)
    async.each(
      this.branches,
      function (stateMachineName, cb) {
        _this.options.executioner(
          _.cloneDeep(executionDescription.ctx),
          stateMachineName,
          {
            parentExecutionName: parentExecutionName,
            rootExecutionName: rootExecutionName
          },
          _this.options,
          function (err, childExecutionDescription) {
            if (err) {
              cb(err)
            } else {
              _this.parallelBranchTracker.addChildExecutionName(
                parentExecutionName,
                childExecutionDescription.executionName
              )
              cb(null)
            }
          }
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
