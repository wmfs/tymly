const boom = require('boom')
const debug = require('debug')('flobotExpressPlugin')

module.exports = function startExecution (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const statebox = services.statebox
  let stateExecutionName

  if (req.body.hasOwnProperty('stateExecutionName')) {
    stateExecutionName = req.body.stateExecutionName
  } else {
    stateExecutionName = [
      req.body.namespace,
      req.body.stateMachineName,
      req.body.version.split('.').join('_')
    ].join('_')
  }

  const options = JSON.parse(JSON.stringify(req.body))

  options.onAuthorizationHook = services.users.onAuthorizationHook.bind(services.users)
  options.action = 'startExecution'
  options.stateExecutionName = stateExecutionName

  const userId = authService.extractUserIdFromRequest(req)
  if (userId) {
    options.userId = userId
  }

  debug(`Request to '${options.action}' on '${options.stateExecutionName}' (by user '${options.userId}')`)

  statebox.startExecution(
    options.input || {},
    stateExecutionName,
    {},
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
