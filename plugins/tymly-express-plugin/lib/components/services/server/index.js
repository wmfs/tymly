'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const addStaticDir = require('./add-static-dir')
const schema = require('./schema.json')

class ExpressServerService {
  boot (options, callback) {
    const _this = this

    // Create a new Express app
    const app = express()
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())

    options.messages.info('Created Express.js app')

    // Make Tymly Control available to routes
    app.set('services', options.bootedServices)

    // Allow CORS
    app.use(
      function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With')
        next()
      }
    )

    options.messages.info('Configured CORS')

    addStaticDir(
      app,
      express,
      options.blueprintComponents,
      options.config,
      options.messages,
      options.bootedServices.temp.tempDir,
      function (err) {
        if (err) {
          callback(err)
        } else {
          _this.express = express

          /**
           * @property {Object} app A ready-to-go Express app
           * @example
           * var port = 3000
           * server.app.listen(port, function () {
           *   console.log('')
           *   console.log('Tymly server is available http://localhost:' + port)
           * })
           */
          _this.app = app
          callback(null)
        }
      }
    )
  }
}

module.exports = {
  serviceClass: ExpressServerService,
  bootAfter: ['temp'],
  schema: schema
}
