const debug = require('debug')('tymlyExpressPlugin')
const respond = require('../../../../util/respond')

module.exports = function describeExecution (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const statebox = services.statebox

  const options = {
    executionName: req.params.executionName,
    action: 'describeExecution'
  }

  const userId = authService.extractUserIdFromRequest(req)
  if (userId) {
    options.userId = userId
  }

  debug(`Request to '${options.action}' by user '${options.userId}' (executionName='${options.executionName}')`)

  statebox.describeExecution(
    options.executionName,
    {},
    function (err, executionDescription) {
      respond(res, err, executionDescription, 200, 'Statebox returned an error while attempting to describe execution')
    }
  )
}
