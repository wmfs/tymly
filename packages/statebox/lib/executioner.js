const stateMachines = require('./state-machines')
const boom = require('boom')

function executioner (input, stateMachineName, executionOptions, options, callback) {
  // References
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_StartExecution.html
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html
  // TODO: Test 'input' conforms
  // TODO: Note API usually requires a string, but object seems better for Statebox?
  // TODO: Persist executionOptions?
  const stateMachineToExecute = stateMachines.findStateMachineByName(stateMachineName)
  if (!stateMachineToExecute) {
    // No stateMachine!
    return callback(
      boom.badRequest(
        `Unknown stateMachine with name '${stateMachineName}'`,
        stateMachineName
      )
    )
  } // if ...

  const currentResource = stateMachineToExecute.definition.States[stateMachineToExecute.startAt].Resource
  options.dao.createNewExecution(
    stateMachineToExecute.startAt,
    currentResource,
    input,
    stateMachineName,
    executionOptions
  )
    .then(executionDescription => {
      stateMachineToExecute.processState(executionDescription.executionName)
      if (hasDelayedResponse(executionOptions)) {
        return options.callbackManager.addCallback(
          executionOptions.sendResponse,
          executionDescription.executionName,
          callback
        )
      } else {
        callback(null, executionDescription)
      } // if ...
    })
    .catch(err => callback(err))
}

function hasDelayedResponse (executionOptions) {
  return executionOptions.sendResponse &&
    executionOptions.sendResponse !== 'IMMEDIATELY'
} // hasCallback

module.exports = executioner
