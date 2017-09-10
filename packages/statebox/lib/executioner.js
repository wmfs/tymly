'use strict'
const stateMachines = require('./state-machines')
const boom = require('boom')

module.exports = function startExecution (input, stateMachineName, executionOptions, options, callback) {
  // References
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_StartExecution.html
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html
  // TODO: Test 'input' conforms
  // TODO: Note API usually requires a string, but object seems better for Statebox?
  const stateMachineToExecute = stateMachines.findStateMachineByName(stateMachineName)
  if (stateMachineToExecute) {
    options.dao.createNewExecution(
      stateMachineToExecute.startAt,
      input,
      stateMachineName,
      executionOptions,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          stateMachineToExecute.processState(executionDescription.executionName)
          callback(
            null,
            executionDescription
          )
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
