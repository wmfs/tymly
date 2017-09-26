module.exports = function cancelFlobotRoute (req, res) {
  const boom = require('boom')
  const services = req.app.get('services')
  const authService = services.auth
  const statebox = services.statebox

  statebox.stopExecution(
    'Execution stopped externally',
    'STOPPED',
    req.params.executionName,
    {
      userId: authService.extractUserIdFromRequest(req),
      // onAuthorizationHook: flobotServices.users.onAuthorizationHook.bind(flobotServices.users),
      action: 'stopExecution'
    },
    function (err) {
      if (err) {
        let boomErr
        if (err.isBoom) {
          boomErr = err
        } else {
          boomErr = boom.internal(`Execution returned an error while attempting to stop (executionName='${req.params.executionName})'`, err)
        }
        res.status(boomErr.output.statusCode).send(boomErr.output.payload)
      } else {
        res.status(204).send()
      }
    }
  )
}
