class TestApiEndPoint {
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
  // Remit routes
  // ------------
  const router = express.Router()
  router.get('/', jwtCheck, getTestResponse)
  app.use('/test-endpoint', router)
}

function getTestResponse (req, res) {
  const testResponse = {
    'stateMachinesUserCanStart': [],
    'forms': {}
  }

  res.status(200).send(testResponse)
}

module.exports = {
  serviceClass: TestApiEndPoint,
  bootAfter: ['jwtAuth', 'server']
}
