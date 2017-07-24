module.exports = function getFlobotRoute (req, res) {
  const flobotServices = req.app.get('flobotServices')
  const authService = flobotServices.auth
  const flobotsService = flobotServices.flobots
  const boom = require('boom')

  flobotsService.getFlobot(
    req.params.flobotId,
    {
      userId: authService.extractUserIdFromRequest(req),
      onAuthorizationHook: flobotServices.users.onAuthorizationHook.bind(flobotServices.users),
      action: 'getFlobot'
    },
    function (err, flobot) {
      if (err) {
        let boomErr
        if (err.isBoom) {
          boomErr = err
        } else {
          boomErr = boom.internal('Flobot returned an error while attempting to get', err)
        }
        res.status(boomErr.output.statusCode).send(boomErr.output.payload)
      } else {
        res.status(200).send(
          {
            flobot: flobot
          }
        )
      }
    }
  )
}
