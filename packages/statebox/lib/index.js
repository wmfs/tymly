'use strict'

// Amazon States Language reference
//   Specification: https://states-language.net/spec.html
//   API: http://docs.aws.amazon.com/step-functions/latest/apireference/API_CreateStateMachine.html
//   https://aws.amazon.com/step-functions/
//   https://aws.amazon.com/blogs/aws/new-aws-step-functions-build-distributed-applications-using-visual-workflows/

const _ = require('lodash')
const Executions = require('./Executions')
const flows = require('./flows')

const resources = require('./resources')
const getExecutionDescription = require('./utils/get-execution-description')
const ensureDatabaseObjects = require('./utils/ensure-database-objects')

class Statebox {
  boot (options, callback) {
    this.client = options.client
    this.options = _.defaults(options, {schemaName: 'statebox'})
    this.executions = new Executions(this.options)
    getExecutionDescription.applyOptions(this.options)
    ensureDatabaseObjects(this.options, callback)
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
      this.executions,
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

  startExecution (input, flowName, callback) {
    this.executions.start(input, flowName, callback)
  }

  stopExecution (cause, error, executionName, callback) {

  }

  listExecutions (callback) {

  }

  describeExecution (executionName, callback) {
    getExecutionDescription.findByName(executionName, callback)
  }
}

module.exports = Statebox
