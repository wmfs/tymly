'use strict'

// http://docs.aws.amazon.com/step-functions/latest/apireference/Welcome.html
const routes = require('./routes/index')

class StateboxApiService {
  boot (options, callback) {
    const express = options.bootedServices.server.express
    const app = options.bootedServices.server.app
    const jwtCheck = options.bootedServices.jwtAuth.jwtCheck

    addExpressApi(
      express,
      app,
      jwtCheck
    )
    callback(null)
  }
}

function addExpressApi (express, app, jwtCheck) {
  // Statebox routes
  // ---------------
  const router = express.Router()
  router.post('/', jwtCheck, routes.startExecution)
  router.get('/:executionName', jwtCheck, routes.describeExecution)
  router.put('/:executionName', jwtCheck, routes.executionAction)
  router.delete('/:executionName', jwtCheck, routes.stopExecution)
  app.use('/executions', router)
}

module.exports = {
  serviceClass: StateboxApiService,
  bootAfter: ['jwtAuth', 'rbac', 'statebox']
}
