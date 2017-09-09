'use strict'

// Amazon States Language reference
//   Specification: https://states-language.net/spec.html
//   API: http://docs.aws.amazon.com/step-functions/latest/apireference/API_CreateStateMachine.html
//   https://aws.amazon.com/step-functions/
//   https://aws.amazon.com/blogs/aws/new-aws-step-functions-build-distributed-applications-using-visual-workflows/

const executioner = require('./executioner')
const flows = require('./flows')
const async = require('async')
const resources = require('./resources')
const MemoryDao = require('./Memory-dao')

class Statebox {
  constructor (options) {
    this.options = options || {}
    if (!this.options.hasOwnProperty('dao')) {
      this.options.dao = new MemoryDao(options)
    }
    this.options.executioner = executioner
  }

  createModuleResource (name, functionClass) {
    resources.createModule(name, functionClass)
  }

  validateFlowDefinition (definition, callback) {
    flows.validateFlowDefinition(definition, callback)
  }

  createFlow (name, definition, callback) {
    flows.createFlow(
      name,
      definition,
      this.options,
      callback)
  }

  deleteFlow (name, callback) {
    flows.deleteFlow(name, callback)
  }

  describeFlow (name, callback) {
    flows.describeFlow(name, callback)
  }

  listFlows (callback) {
    flows.listFlows(callback)
  }

  findFlowByName (name) {
    flows.findFlowByName(name)
  }

  findFlows (options, callback) {
    flows.findFlows(options, callback)
  }

  createTaskResource (name, definition, callback) {

  }

  deleteTaskResource (name, callback) {

  }

  describeTaskResource (name, callback) {

  }

  listTaskResources (callback) {

  }

  startExecution (input, flowName, executionOptions, callback) {
    executioner(input, flowName, executionOptions, this.options, callback)
  }

  stopExecution (cause, error, executionName, callback) {

  }

  listExecutions (callback) {

  }

  describeExecution (executionName, callback) {
    this.options.dao.findExecutionByName(executionName, callback)
  }

  waitUntilExecutionStatus (executionName, expectedStatus, callback) {
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
        return latestExecutionDescription.status === expectedStatus
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
