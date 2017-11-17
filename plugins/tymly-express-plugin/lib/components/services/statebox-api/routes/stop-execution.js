const debug = require('debug')('statebox')
const respond = require('../../../../util/respond')

module.exports = function cancelTymlyRoute (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const statebox = services.statebox

  const options = {
    userId: authService.extractUserIdFromRequest(req),
    action: 'stopExecution',
    stateMachineName: req.params.executionName
  }

  debug(`Request to '${options.action}' on '${options.stateMachineName}' (by user '${options.userId}')`)

  statebox.stopExecution(
    'Execution stopped externally',
    'STOPPED',
    req.params.executionName,
    options,
    function (err, executionDescription) {
      respond(res, err, executionDescription, 204, `Execution returned an error while attempting to stop (executionName='${req.params.executionName})'`)
    }
  )
}
