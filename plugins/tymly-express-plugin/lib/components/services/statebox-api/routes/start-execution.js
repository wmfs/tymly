'use strict'

const _ = require('lodash')
const respond = require('./respond')
const debug = require('debug')('statebox')

module.exports = function startExecution (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const statebox = services.statebox
  const stateMachineName = req.body.stateMachineName

  const input = cloneOrDefault(req.body.input)
  const options = cloneOrDefault(req.body.options)
  // options.onAuthorizationHook = services.users.onAuthorizationHook.bind(services.users)
  options.action = 'startExecution'
  options.stateMachineName = stateMachineName

  const userId = authService.extractUserIdFromRequest(req)
  if (userId) {
    options.userId = userId
  }

  debug(`Request to '${options.action}' on '${options.stateMachineName}' (by user '${options.userId}')`)

  statebox.startExecution(
    input,
    stateMachineName,
    options,
    function (err, executionDescription) {
      respond(res, err, executionDescription, 201, 'Statebox returned an error while attempting to start')
    }
  )
}

function cloneOrDefault (obj) {
  return obj ? _.cloneDeep(obj) : { }
}
