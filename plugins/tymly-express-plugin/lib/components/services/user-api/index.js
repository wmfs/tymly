'use strict'

const routes = require('./routes/index')

class UserApiService {
  boot (options, callback) {
    const express = options.bootedServices.server.express
    const app = options.bootedServices.server.app
    const jwtCheck = options.bootedServices.auth.jwtCheck

    addExpressApi(
      express,
      app,
      jwtCheck
    )

    callback(null)
  }
}

function addExpressApi (express, app, jwtCheck) {
  // Remit routes
  // ------------
  const router = express.Router()
  router.get('/', jwtCheck, routes.getUserRemit)
  app.use('/remit', router)
}

module.exports = {
  serviceClass: UserApiService,
  bootAfter: ['auth', 'rbac']
}
