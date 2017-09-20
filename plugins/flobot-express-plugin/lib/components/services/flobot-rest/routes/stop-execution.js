module.exports = function cancelFlobotRoute (req, res) {
  const boom = require('boom')
  const flobotServices = req.app.get('flobotServices')
  const authService = flobotServices.auth
  const flobotsService = flobotServices.flobots
  flobotsService.cancelFlobot(
    req.params.flobotId,
    {
      userId: authService.extractUserIdFromRequest(req),
      onAuthorizationHook: flobotServices.users.onAuthorizationHook.bind(flobotServices.users),
      action: 'cancelFlobot'
    },
    function (err) {
      if (err) {
        let boomErr
        if (err.isBoom) {
          boomErr = err
        } else {
          boomErr = boom.internal('Flobot returned an error while attempting to cancel', err)
        }
        res.status(boomErr.output.statusCode).send(boomErr.output.payload)
      } else {
        res.status(204).send()
      }
    }
  )
}
