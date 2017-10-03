'use strict'
const tymly = require('tymly')
const config = require('config')
const process = require('process')
const jwt = require('jsonwebtoken')
const Buffer = require('safe-buffer').Buffer

console.log('Tymly Runner')
console.log('-------------')

// Add an admin user if defined via $TYMLY_ADMIN_USERID
let adminUserId = process.env.TYMLY_ADMIN_USERID

if (adminUserId) {
  // UserID might be double-quoted, so remove if that's the case
  if (adminUserId[0] === '"' && adminUserId[adminUserId.length - 1] === '"') {
    adminUserId = adminUserId.substring(1, adminUserId.length - 1)
  }
  config.config.defaultUsers = {}
  config.config.defaultUsers[adminUserId] = process.env.TYMLY_ADMIN_ROLES.split(',')
}

console.log('defaultUsers:')
console.log(JSON.stringify(config.config.defaultUsers, null, 2))

tymly.boot(
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
            new Buffer(process.env.TYMLY_AUTH_SECRET, 'base64'),
            {
              subject: adminUserId,
              audience: process.env.TYMLY_AUTH_AUDIENCE
            }
          )

          console.log(`Server listening on port ${config.config.serverPort}!\n`)
          services.rbac.rbac.debug()
          console.log(`Admin token: ${adminToken}`)
        })
      }

      console.log('Done booting.')
    }
  }
)
