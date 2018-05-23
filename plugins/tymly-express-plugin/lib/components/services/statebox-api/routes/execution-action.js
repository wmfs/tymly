const _ = require('lodash')
const boom = require('boom')
const actions = require('./actions/index')

module.exports = function (req, res) {
  const services = req.app.get('services')
  const jwtAuthService = services.jwtAuth
  const body = _.cloneDeep(req.body)
  const env = {
    services: services,
    authService: jwtAuthService,
    body: body,
    userId: jwtAuthService.extractUserIdFromRequest(req)
  }

  if (actions.hasOwnProperty(env.body.action)) {
    actions[env.body.action](
      services.statebox,
      req,
      res,
      env
    )
  } else {
    res.status(404).send(
      boom.notFound(
        `Unknown execution action '${env.body.action}'`,
        {
          action: env.body.action
        }
      ).output.payload
    )
  }
}
