const debug = require('debug')('statebox')
const boomUp = require('./boom-up')

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
    function (err) {
      if (err) {
        const boomErr = boomUp(err, `Execution returned an error while attempting to stop (executionName='${req.params.executionName})'`)
        res.status(boomErr.output.statusCode).send(boomErr.output.payload)
      } else {
        res.status(204).send()
      }
    }
  )
}
