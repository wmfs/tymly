'use strict'

// Amazon States Language reference
//   Specification: https://states-language.net/spec.html
//   API: http://docs.aws.amazon.com/step-functions/latest/apireference/API_CreatestateMachine.html
//   https://aws.amazon.com/step-functions/
//   https://aws.amazon.com/blogs/aws/new-aws-step-functions-build-distributed-applications-using-visual-workstateMachines/

const executioner = require('./executioner')
const stateMachines = require('./state-machines')
const resources = require('./resources')
const MemoryDao = require('./dao/Memory-dao')
const StorageDao = require('./dao/StorageService-dao')
const Status = require('./Status')
const ParallelBranchTracker = require('./Parallel-branch-tracker')
const CallbackManager = require('./Callback-manager')
const debug = require('debug')('statebox')

class Statebox {
  constructor (options) {
    this.options = options || {}
    this.ready_ = this._findDao(options)
      .then(dao => {
        info(options.messages, 'Statebox is ready')
        this.options.dao = dao
        this.options.executioner = executioner
        this.options.callbackManager = new CallbackManager()
        this.options.parallelBranchTracker = new ParallelBranchTracker()
      })
  }

  get ready () {
    return this.ready_
  } // ready

  async _findDao (options) {
    if (options.dao) {
      debug('Using custom Dao')
      return options.dao // custom DAO provided
    }

    const storageDao = await this._daoFromStorage(options)
    if (storageDao) {
      debug('Using Storage Dao')
      return storageDao
    }

    debug('Using built in MemoryDao')
    return new MemoryDao(options)
  } // _findDao

  async _daoFromStorage (options) {
    if (!options.bootedServices || !options.bootedServices.storage) {
      return null
    }
    try {
      const storage = options.bootedServices.storage
      info(options.messages, `Using storage service ${storage.storageName}`)
      let model = storage.models[StorageDao.ExecutionModelName]
      if (!model) {
        info(options.messages, `Adding model ${StorageDao.ExecutionModelName}`)
        model = await storage.addModel(
          StorageDao.ExecutionModelName,
          StorageDao.ExecutionModelDefinition,
          options.messages
        )
      }
      return new StorageDao(model)
    } catch (err) {
      warning(options.messages, `Could not get Dao from storage service`)
      warning(options.messages, err)
      warning(options.messages, `Falling back to in-memory Dao`)
    }
    return null
  } // _daoFromStorage

  createModuleResource (moduleName, moduleClass) {
    resources.createModule(moduleName, moduleClass)
  }

  createModuleResources (moduleResources) {
    resources.createModules(moduleResources)
  }

  validatStateMachineDefinition (name, definition) {
    stateMachines.validateStateMachineDefinition(name, definition)
  }

  createStateMachine (stateMachineName, stateMachineDefinition, stateMachineMeta, env, callback) {
    stateMachines.createStateMachine(
      stateMachineName,
      stateMachineDefinition,
      stateMachineMeta,
      env,
      this.options,
      callback)
  } // createStateMachine

  createStateMachines (stateMachineDefinitions, env, callback) {
    stateMachines.createStateMachines(
      stateMachineDefinitions,
      env,
      this.options,
      callback)
  } // createStateMachines

  deleteStateMachine (name) {
    stateMachines.deleteStateMachine(name)
  }

  describeStateMachine (name) {
    stateMachines.describeStateMachine(name)
  }

  listStateMachines () {
    return stateMachines.listStateMachines()
  }

  findStateMachineByName (name) {
    return stateMachines.findStateMachineByName(name)
  }

  findStateMachines (options) {
    return stateMachines.findStateMachines(options)
  }

  findStates (options) {
    return stateMachines.findStates(options)
  }

  _promised (fn, ...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  } // promised

  startExecution (input, stateMachineName, executionOptions, callback) {
    if (!callback) return this._promised(this.startExecution, input, stateMachineName, executionOptions)

    executioner(input, stateMachineName, executionOptions, this.options, callback)
  } // startExecution

  stopExecution (cause, errorCode, executionName, executionOptions, callback) {
    if (!callback) return this._promised(this.stopExecution, cause, errorCode, executionName, executionOptions)

    this.options.dao.findExecutionByName(executionName)
      .then(executionDescription => {
        if (executionDescription && executionDescription.status === Status.RUNNING) {
          this.options.dao.stopExecution(
            cause,
            errorCode,
            executionName,
            executionOptions,
            callback
          )
        } else {
          callback(new Error(`Execution is not running, and cannot be stopped (executionName='${executionName}')`))
        }
      })
      .catch(err => callback(err))
  } // _stopExecution

  listExecutions (executionOptions, callback) {
    callback(null)
  }

  describeExecution (executionName, executionOptions, callback) {
    if (!callback) return this._promised(this.describeExecution, executionName, executionOptions)

    this.options.dao.findExecutionByName(executionName, callback)
  } // describeExecution

  sendTaskSuccess (executionName, output, executionOptions, callback) {
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          if (executionDescription && executionDescription.status === Status.RUNNING) {
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
  } // _sendTaskSuccess

  sendTaskFailure (executionName, options, executionOptions, callback) {
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          if (executionDescription && executionDescription.status === Status.RUNNING) {
            const stateMachine = stateMachines.findStateMachineByName(executionDescription.stateMachineName)
            const stateToRun = stateMachine.states[executionDescription.currentStateName]
            stateToRun.runTaskFailure(executionDescription, options, callback)
          } else {
            callback(
              new Error(`Failure has been rejected because execution is not running (executionName='${executionName}')`)
            )
          }
        }
      }
    )
  }

  sendTaskHeartbeat (executionName, options, executionOptions, callback) {
    this.options.dao.findExecutionByName(
      executionName,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          if (executionDescription && executionDescription.status === Status.RUNNING) {
            const stateMachine = stateMachines.findStateMachineByName(executionDescription.stateMachineName)
            const stateToRun = stateMachine.states[executionDescription.currentStateName]
            stateToRun.runTaskHeartbeat(executionDescription, options, callback)
          } else {
            callback(
              new Error(`Heartbeat has been rejected because execution is not running (executionName='${executionName}')`)
            )
          }
        }
      }
    )
  } // _sendTaskHeartbeat

  async waitUntilStoppedRunning (executionName) {
    let notFound = 0

    do {
      const executionDescription = await this.options.dao.findExecutionByName(executionName)

      if (typeof executionDescription !== 'object') {
        ++notFound
      } else if (executionDescription.status !== Status.RUNNING) {
        return executionDescription
      }

      await pause(50)
    } while (notFound !== 5)

    throw new Error(`Could not find execution ${executionName}`)
  } // _waitUntilStoppedRunning
} // class Statebox

function pause (duration) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), duration)
  })
} // _pause

function info (messages, msg) {
  if (messages) {
    messages.info(msg)
  } else {
    console.log(msg)
  }
} // info
function warning (messages, msg) {
  if (messages) {
    info(messages, msg)
    messages.warning(msg)
  } else {
    console.log(msg)
  }
} // warning

module.exports = Statebox
