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
const routes = require('./routes/index')
const CallbackManager = require('./Callback-manager')

class Statebox {
  constructor (options) {
    this.options = options || {}
    if (!this.options.hasOwnProperty('dao')) {
      this.options.dao = new MemoryDao(options)
    }
    this.options.executioner = executioner
    this.options.callbackManager = new CallbackManager()
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

  stopExecution (cause, errorCode, executionName, executionOptions, callback) {
    const _this = this
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          if (executionDescription.status === 'RUNNING') {
            _this.options.dao.stopExecution(
              cause,
              errorCode,
              executionName,
              executionOptions,
              callback
            )
          } else {
            callback(
              new Error(`Execution is not running, and cannot be stopped (executionName='${executionName}')`)
            )
          }
        }
      }
    )
  }

  listExecutions (executionOptions, callback) {
    callback(null)
  }

  describeExecution (executionName, executionOptions, callback) {
    this.options.dao.findExecutionByName(executionName, callback)
  }

  sendTaskSuccess (executionName, output, executionOptions, callback) {
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          if (executionDescription.status === 'RUNNING') {
            const stateMachine = stateMachines.findStateMachineByName(executionDescription.stateMachineName)
            const stateToRun = stateMachine.states[executionDescription.currentStateName]
            stateToRun.runTaskSuccess(executionDescription, output)
            callback(null)
          } else {
            callback(
              new Error(`Success has been rejected because execution is not running (executionName='${executionName}')`)
            )
          }
        }
      }
    )
  }

  sendTaskFailure (executionName, options, executionOptions, callback) {
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          if (executionDescription.status === 'RUNNING') {
            const stateMachine = stateMachines.findStateMachineByName(executionDescription.stateMachineName)
            const stateToRun = stateMachine.states[executionDescription.currentStateName]
            stateToRun.runTaskFailure(executionDescription, options)
            callback(null)
          } else {
            callback(
              new Error(`Failure has been rejected because execution is not running (executionName='${executionName}')`)
            )
          }
        }
      }
    )
  }

  sendTaskHeartbeat (executionName, output, executionOptions, callback) {
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          if (executionDescription.status === 'RUNNING') {
            const stateMachine = stateMachines.findStateMachineByName(executionDescription.stateMachineName)
            const stateToRun = stateMachine.states[executionDescription.currentStateName]
            stateToRun.runTaskHeartbeat(executionDescription, output, callback)
          } else {
            callback(
              new Error(`Heartbeat has been rejected because execution is not running (executionName='${executionName}')`)
            )
          }
        }
      }
    )
  }

  addExpressApi (express, app, jwtCheck) {
    // Statebox routes
    // ---------------
    let router = express.Router()
    router.post('/', jwtCheck, routes.startExecution)
    router.get('/:executionName', jwtCheck, routes.describeExecution)
    router.put('/:executionName', jwtCheck, routes.executionAction)
    router.delete('/:executionName', jwtCheck, routes.stopExecution)
    app.use('/executions', router)

    // Remit routes
    // ------------
    router = express.Router()
    router.get('/', jwtCheck, routes.getUserRemit)
    app.use('/remit', router)
  }

  waitUntilStoppedRunning (executionName, callback) {
    // TODO: Back-offs, timeouts etc.
    const _this = this
    async.doUntil(
      function (cb) {
        _this.options.dao.findExecutionByName(
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
