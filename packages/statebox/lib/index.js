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

  createModuleResource (moduleName, moduleClass) {
    resources.createModule(moduleName, moduleClass)
  }

  createModuleResources (moduleResources) {
    resources.createModules(moduleResources)
  }

  validatStateMachineDefinition (name, definition) {
    stateMachines.validateStateMachineDefinition(name, definition)
  }

  createStateMachines (stateMachineDefinitions, env, callback) {
    stateMachines.createStateMachines(
      stateMachineDefinitions,
      env,
      this.options,
      callback)
  }

  createStateMachinesP (stateMachineDefinitions, env) {
    return new Promise((resolve, reject) => {
      this.createStateMachines(stateMachineDefinitions, env, (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
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

  startExecutionP (input, stateMachineName, executionOptions) {
    return new Promise((resolve, reject) => {
      executioner(input, stateMachineName, executionOptions, this.options,
        (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
    })
  } // startExecutionP

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

  waitUntilStoppedRunningP (execution) {
    return new Promise((resolve, reject) => {
      this.waitUntilStoppedRunning(
        execution,
        (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        }
      )
    })
  }
}

module.exports = Statebox
