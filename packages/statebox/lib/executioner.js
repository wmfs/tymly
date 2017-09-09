'use strict'
const flows = require('./flows')
const boom = require('boom')

module.exports = function startExecution (input, flowName, executionOptions, options, callback) {
  // References
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_StartExecution.html
  //   http://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html
  // TODO: Test 'input' conforms
  // TODO: Note API usually requires a string, but object seems better for Statebox?
  const flowToExecute = flows.findFlowByName(flowName)
  if (flowToExecute) {
    options.dao.createNewExecution(
      flowToExecute.startAt,
      input,
      flowName,
      executionOptions,
      function (err, executionDescription) {
        if (err) {
          callback(err)
        } else {
          flowToExecute.processState(executionDescription.executionName)
          callback(
            null,
            executionDescription
          )
        }
      }
    )
  } else {
    // No Flow!
    callback(
      boom.badRequest(
        `Unknown Flow with name '${flowName}'`,
        flowName
      )
    )
  }
}
