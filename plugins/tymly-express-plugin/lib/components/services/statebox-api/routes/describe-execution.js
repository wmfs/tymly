const debug = require('debug')('tymlyExpressPlugin')
const respond = require('../../../../util/respond')

module.exports = function describeExecution (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const statebox = services.statebox

  // {
  //   userId: authService.extractUserIdFromRequest(req),
  //     onAuthorizationHook: tymlyServices.users.onAuthorizationHook.bind(tymlyServices.users),
  //   action: 'describeExecution'
  // },

  const options = {}
  options.executionName = req.params.executionName
  options.onAuthorizationHook = services.users.onAuthorizationHook.bind(services.users)
  options.action = 'describeExecution'

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
