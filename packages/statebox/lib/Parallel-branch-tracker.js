'use strict'

module.exports = class ParallelBranchTracker {
  constructor () {
    this.parentExecutions = {}
    this.childExecutions = {}
  }

  addParentExecutionName (parentExecutionName) {
    this.parentExecutions[parentExecutionName] = {
      running: 0
    }
  }

  addChildExecutionName (parentExecutionName, childExecutionName) {
    this.childExecutions[childExecutionName] = parentExecutionName
    this.parentExecutions[parentExecutionName].running++
  }

  registerChildExecutionEnd (childExecutionName) {
    const parentExecutionName = this.childExecutions[childExecutionName]
    const parent = this.parentExecutions[parentExecutionName]
    parent.running--
  }

  registerChildExecutionFail (childExecutionName) {
    // TODO: Garbage collect
  }

  getParallelTaskStatus (parentExecutionName) {
    let status
    const parent = this.parentExecutions[parentExecutionName]
    if (parent.running === 0) {
      // TODO: Garbage collect
      status = 'SUCCEEDED'
    } else {
      status = 'RUNNING'
    }
    return status
  }
}
