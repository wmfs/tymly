'use strict'

const _ = require('lodash')
const boom = require('boom')
const debug = require('debug')('flobotExpressPlugin')

module.exports = function startExecution (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const statebox = services.statebox
  const stateMachineName = req.body.stateMachineName

  let input = req.body.input
  if (input) {
    input = _.cloneDeep(input)
  } else {
    input = {}
  }

  let options = req.body.options
  if (options) {
    options = _.cloneDeep(options)
  } else {
    options = {}
  }

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
      if (err) {
        let boomErr
        if (err.isBoom) {
          boomErr = err
        } else {
          boomErr = boom.internal('Statebox returned an error while attempting to start', err)
        }
        res.status(boomErr.output.statusCode).send(boomErr.output.payload)
      } else {
        res.status(201).send(executionDescription)
      }
    }
  )
}
