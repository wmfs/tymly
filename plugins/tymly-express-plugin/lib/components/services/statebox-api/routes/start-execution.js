'use strict'

const _ = require('lodash')
const respond = require('../../../../util/respond')
const debug = require('debug')('statebox')
const boom = require('boom')

module.exports = function startExecution (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const statebox = services.statebox
  const rbac = services.rbac
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

  const rbacAuthenticated = rbac.checkRoleAuthorization(options.userId, options, ['test_developer'], 'stateMachine', options.stateMachineName, options.action)
  debug(`Request to '${options.action}' on '${options.stateMachineName}' (by user '${options.userId}') - ${rbacAuthenticated}`)

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
  return obj ? _.cloneDeep(obj) : {}
}
