'use strict'

// Amazon States Language reference
//   Specification: https://states-language.net/spec.html
//   API: http://docs.aws.amazon.com/step-functions/latest/apireference/API_CreatestateMachine.html
//   https://aws.amazon.com/step-functions/
//   https://aws.amazon.com/blogs/aws/new-aws-step-functions-build-distributed-applications-using-visual-workstateMachines/

const executioner = require('./executioner')
const stateMachines = require('./state-machines')
const async = require('async')
const resources = require('./resources')
const MemoryDao = require('./Memory-dao')
const ParallelBranchTracker = require('./Parallel-branch-tracker')
class Statebox {
  constructor (options) {
    this.options = options || {}
    if (!this.options.hasOwnProperty('dao')) {
      this.options.dao = new MemoryDao(options)
    }
    this.options.executioner = executioner
    this.options.parallelBranchTracker = new ParallelBranchTracker()
  }

  createModuleResource (name, functionClass) {
    resources.createModule(name, functionClass)
  }

  validatStateMachineDefinition (name, definition) {
    stateMachines.validateStateMachineDefinition(name, definition)
  }

  createStateMachine (name, definition, callback) {
    stateMachines.createStateMachine(
      name,
      definition,
      this.options,
      callback)
  }

  deleteStateMachine (name) {
    stateMachines.deleteStateMachine(name)
  }

  describeStateMachine (name) {
    stateMachines.describeStateMachine(name)
  }

  listStateMachines () {
    stateMachines.listStateMachines()
  }

  findStateMachineByName (name) {
    return stateMachines.findStateMachineByName(name)
  }

  findStateMachines (options) {
    return stateMachines.findStateMachines(options)
  }

  startExecution (input, stateMachineName, executionOptions, callback) {
    executioner(input, stateMachineName, executionOptions, this.options, callback)
  }

  stopExecution (cause, error, executionName, callback) {

  }

  listExecutions (callback) {

  }

  describeExecution (executionName, callback) {
    this.options.dao.findExecutionByName(executionName, callback)
  }

  waitUntilStoppedRunning (executionName, callback) {
    // TODO: Back-offs, timeouts etc.
    const _this = this
    async.doUntil(
      function (cb) {
        _this.describeExecution(
          executionName,
          function (err, latestExecutionDescription) {
            if (err) {
              cb(err)
            } else {
              setTimeout(
                function () {
                  cb(null, latestExecutionDescription)
                },
                50
              )
            }
          }
        )
      },
      function (latestExecutionDescription) {
        return latestExecutionDescription.status !== 'RUNNING'
      },
      function (err, finalExecutionDescription) {
        if (err) {
          callback(err)
        } else {
          callback(null, finalExecutionDescription)
        }
      }
    )
  }
}

module.exports = Statebox
