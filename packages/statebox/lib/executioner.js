'use strict'
const stateMachines = require('./state-machines')
const boom = require('boom')
const _ = require('lodash')

module.exports = function executioner (input, stateMachineName, executionOptions, options, callback) {
  // References
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_StartExecution.html
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html
  // TODO: Test 'input' conforms
  // TODO: Note API usually requires a string, but object seems better for Statebox?
  const stateMachineToExecute = stateMachines.findStateMachineByName(stateMachineName)
  if (stateMachineToExecute) {
    const currentResource = stateMachineToExecute.definition.States[stateMachineToExecute.startAt].Resource
    options.dao.createNewExecution(
      stateMachineToExecute.startAt,
      currentResource,
      input,
      stateMachineName,
      executionOptions,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          stateMachineToExecute.processState(executionDescription.executionName)
          if (_.isObject(executionOptions) && executionOptions.hasOwnProperty('sendResponse') && executionOptions.sendResponse !== 'immediately') {
            options.callbackManager.addCallback(
              executionOptions.sendResponse,
              executionDescription.executionName,
              callback
            )
          } else {
            callback(
              null,
              executionDescription
            )
          }
        }
      }
    )
  } else {
    // No stateMachine!
    callback(
      boom.badRequest(
        `Unknown stateMachine with name '${stateMachineName}'`,
        stateMachineName
      )
    )
  }
}
