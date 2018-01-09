'use strict'
const tymly = require('tymly')
const config = require('config')
const process = require('process')

console.log('Tymly Runner')
console.log('-------------')

// Add an admin user if defined via $TYMLY_ADMIN_USERID
let adminUserId = confVar('admin', 'userId', 'TYMLY_ADMIN_USERID')

if (adminUserId) {
  // UserID might be double-quoted, so remove if that's the case
  if (adminUserId[0] === '"' && adminUserId[adminUserId.length - 1] === '"') {
    adminUserId = adminUserId.substring(1, adminUserId.length - 1)
  }
  config.config.defaultUsers = {}
  let roles = confVar('admin', 'roles', 'TYMLY_ADMIN_ROLES')
  if (!Array.isArray(roles)) {
    roles = roles.split(',')
  }
  config.config.defaultUsers[adminUserId] = roles
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
      startServer(services)

      console.log('Done booting.')
    }
  }
) // tymly.boot

function startServer (services) {
  if (!services.server) {
    return
  }

  const server = services.server
  const auth = services.auth
  server.listen(config.config.serverPort, function () {
    console.log('\n')

    const adminToken = auth.generateToken(adminUserId)

    console.log(`Server listening on port ${config.config.serverPort}!\n`)
    services.rbac.rbac.debug()
    console.log(`Admin token: ${adminToken}`)
  })
} // startServer

function confVar (section, confName, envVar) {
  if (config.config[section] && config.config[section][confName]) {
    return config.config[section][confName]
  }

  return process.env[envVar]
} // confVar
