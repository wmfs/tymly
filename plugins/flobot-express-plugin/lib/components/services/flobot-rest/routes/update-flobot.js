module.exports = function updateFlobotRoute (req, res) {
  const flobotServices = req.app.get('flobotServices')
  const authService = flobotServices.auth
  const flobotsService = flobotServices.flobots
  const boom = require('boom')
  const options = JSON.parse(JSON.stringify(req.body))
  const userId = authService.extractUserIdFromRequest(req)

  options.onAuthorizationHook = flobotServices.users.onAuthorizationHook.bind(flobotServices.users)
  if (userId) {
    options.userId = userId
  }

  options.action = 'updateFlobot'

  flobotsService.updateFlobot(
        req.params.flobotId,
        options,
        function (err, flobot) {
          if (err) {
            let boomErr
            if (err.isBoom) {
              boomErr = err
            } else {
              boomErr = boom.internal('Flobot returned an error while attempting to update', err)
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
