'use strict'

const routes = require('./routes/index')

class FlobotRestService {
  boot (options, callback) {
    const express = options.bootedServices.server.express
    const app = options.bootedServices.server.app
    const jwtCheck = options.bootedServices.auth.jwtCheck

    // FSM routes
    // ----------
    let router = express.Router()
    router.post('/', jwtCheck, routes.startNewFlobot)
    router.get('/:flobotId', jwtCheck, routes.getFlobot)
    router.put('/:flobotId', jwtCheck, routes.updateFlobot)
    router.delete('/:flobotId', jwtCheck, routes.cancelFlobot)
    app.use('/flobots', router)

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
