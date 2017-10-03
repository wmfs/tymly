const boom = require('boom')
const debug = require('debug')('tymlyExpressPlugin')

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
      if (err) {
        let boomErr
        if (err.isBoom) {
          boomErr = err
        } else {
          boomErr = boom.internal('Statebox returned an error while attempting to describe execution', err)
        }
        res.status(boomErr.output.statusCode).send(boomErr.output.payload)
      } else {
        res.status(200).send(executionDescription)
      }
    }
  )
}
