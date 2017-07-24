'use strict'
const flobot = require('flobot')
const config = require('config')
const process = require('process')
const jwt = require('jsonwebtoken')
const Buffer = require('safe-buffer').Buffer

flobot.boot(
  config,
  function (err, services) {
    if (err) {
      console.error(err)
      console.error('There were errors.')
    } else {
      if (services.server) {
        const app = services.server.app
        app.listen(config.config.serverPort, function () {
          console.log('\n')

          const adminToken = jwt.sign(
            {},
            new Buffer(process.env.FLOBOT_AUTH_SECRET, 'base64'),
            {
              subject: 'admin',
              audience: process.env.FLOBOT_AUTH_AUDIENCE
            }
          )

          console.log(`Server listening on port ${config.config.serverPort}!\n`)
          services.rbac.rbac.debug()
          console.log(`Admin token: ${adminToken}`)
          console.log(config)
        })
      }

      console.log('Done booting.')
    }
  }
)
