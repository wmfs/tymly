module.exports = function startNewFlobotRoute (req, res) {
  const flobotServices = req.app.get('flobotServices')
  const authService = flobotServices.auth
  const flobotsService = flobotServices.flobots
  const boom = require('boom')

  let flowId

  if (req.body.hasOwnProperty('flowId')) {
    flowId = req.body.flowId
  } else {
    flowId = [
      req.body.namespace,
      req.body.flowName,
      req.body.version.split('.').join('_')
    ].join('_')
  }

  const options = JSON.parse(JSON.stringify(req.body))

  options.onAuthorizationHook = flobotServices.users.onAuthorizationHook.bind(flobotServices.users)
  options.action = 'startNewFlobot'
  options.flowId = flowId

  const userId = authService.extractUserIdFromRequest(req)
  if (userId) {
    options.userId = userId
  }

  flobotsService.startNewFlobot(
    flowId,
    options,
    function (err, flobot) {
      if (err) {
        let boomErr
        if (err.isBoom) {
          boomErr = err
        } else {
          boomErr = boom.internal('Flobot returned an error while attempting to start', err)
        }
        res.status(boomErr.output.statusCode).send(boomErr.output.payload)
      } else {
        res.status(201).send(
          {
            flobot: flobot
          }
        )
      }
    }
  )
}
