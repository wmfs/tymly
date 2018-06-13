'use strict'
const cloneDeep = require('lodash/cloneDeep')
const BaseStateType = require('./Base-state')

class Parallel extends BaseStateType {
  constructor (stateName, stateMachine, stateDefinition, options) {
    super(stateName, stateMachine, stateDefinition, options)

    this.options = options
    this.executioner = options.executioner
    this.stateType = 'Parallel'
    this.branches = stateDefinition.Branches
      .map(branchDefinition => {
        const parts = stateMachine.name.split(':')
        const stateMachineName = parts[0] + ':' + branchDefinition.StartAt
        return stateMachineName
      })

    this.debug()
  } // constructor

  process (executionDescription) {
    const parentExecutionName = executionDescription.executionName
    const rootExecutionName = executionDescription.executionOptions.rootExecutionName || executionDescription.executionName
    this.parallelBranchTracker.addParentExecutionName(parentExecutionName)

    const branchExecutions = this.branches
      .map(stateMachineName => {
        const branchContext = cloneDeep(executionDescription.ctx)
        return this.executioner(
          branchContext,
          stateMachineName,
          {
            parentExecutionName: parentExecutionName,
            rootExecutionName: rootExecutionName
          },
          this.options
        ).then(childExecutionDescription =>
          this.parallelBranchTracker.addChildExecutionName(
            parentExecutionName,
            childExecutionDescription.executionName
          )
        )
      })

    Promise.all(branchExecutions)
      .catch(err => { throw new Error(err) }) // TODO: Needs proper handling
  } // process
} // class Parallel

module.exports = Parallel
