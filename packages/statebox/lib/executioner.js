const stateMachines = require('./state-machines')
const boom = require('boom')

async function executioner (input, stateMachineName, executionOptions, options) {
  // References
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_StartExecution.html
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html
  // TODO: Test 'input' conforms
  // TODO: Note API usually requires a string, but object seems better for Statebox?
  // TODO: Persist executionOptions?
  const stateMachineToExecute = stateMachines.findStateMachineByName(stateMachineName)
  if (!stateMachineToExecute) {
    // No stateMachine!
    throw boom.badRequest(
      `Unknown stateMachine with name '${stateMachineName}'`,
      stateMachineName
    )
  } // if ...

  const currentResource = stateMachineToExecute.definition.States[stateMachineToExecute.startAt].Resource
  const executionDescription = await options.dao.createNewExecution(
    stateMachineToExecute.startAt,
    currentResource,
    input,
    stateMachineName,
    executionOptions
  )

  stateMachineToExecute.processState(executionDescription.executionName)
  if (hasDelayedResponse(executionOptions)) {
    return options.callbackManager.addCallback(
      executionOptions.sendResponse,
      executionDescription.executionName
    )
  }

  return executionDescription
} // executioner

function hasDelayedResponse (executionOptions) {
  return executionOptions.sendResponse &&
    executionOptions.sendResponse !== 'IMMEDIATELY'
} // hasCallback

module.exports = executioner
