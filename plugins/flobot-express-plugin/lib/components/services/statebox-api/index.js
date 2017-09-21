'use strict'

// http://docs.aws.amazon.com/step-functions/latest/apireference/Welcome.html

class StateboxApiService {
  boot (options, callback) {
    const statebox = options.bootedServices.statebox.statebox
    const express = options.bootedServices.server.express
    const app = options.bootedServices.server.app
    const jwtCheck = options.bootedServices.auth.jwtCheck

    statebox.addExpressApi(
      express,
      app,
      jwtCheck
    )
    callback(null)
  }
}

module.exports = {
  serviceClass: StateboxApiService,
  bootAfter: ['auth', 'rbac', 'forms', 'statebox']
}
