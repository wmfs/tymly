'use strict'

const routes = require('./routes/index')
// http://docs.aws.amazon.com/step-functions/latest/apireference/Welcome.html

class FlobotRestService {
  boot (options, callback) {
    const express = options.bootedServices.server.express
    const app = options.bootedServices.server.app
    const jwtCheck = options.bootedServices.auth.jwtCheck

    // Statebox routes
    // ---------------
    let router = express.Router()
    router.post('/', jwtCheck, routes.startExecution)
    router.get('/:executionName', jwtCheck, routes.describeExecution)
    router.put('/:executionName', jwtCheck, routes.sendTaskSuccess)
    router.delete('/:executionName', jwtCheck, routes.stopExecution)
    app.use('/executions', router)

    // Remit routes
    // ------------
    router = express.Router()
    router.get('/', jwtCheck, routes.getUserRemit)
    app.use('/remit', router)

    callback(null)
  }
}

module.exports = {
  serviceClass: FlobotRestService,
  bootAfter: ['auth', 'rbac', 'forms']
}
