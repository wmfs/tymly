'use strict'

const process = require('process')
const dottie = require('dottie')
const jwt = require('express-jwt')
const schema = require('./schema.json')

class AuthService {
  boot (options, callback) {
    // Need to find secret/audience.
    // Take from config.auth, and failing that environment variables.

    let configOk = true

    let secret = dottie.get(options, 'config.auth.secret')
    if (secret === undefined) {
      secret = process.env.FLOBOT_AUTH_SECRET
    }

    if (secret === undefined) {
      configOk = false
      options.messages.error(
        {
          name: 'noSecret',
          message: 'No authentication secret was supplied via config or the $FLOBOT_AUTH_SECRET environment variable'
        }
      )
    }

    let audience = dottie.get(options, 'config.auth.audience')
    if (audience === undefined) {
      audience = process.env.FLOBOT_AUTH_AUDIENCE
    }

    if (audience === undefined) {
      configOk = false
      options.messages.error(
        {
          name: 'noAudience',
          message: 'No authentication audience was supplied via config or the $FLOBOT_AUTH_AUDIENCE environment variable'
        }
      )
    }

    if (configOk) {
      const expressApp = options.bootedServices.server.app

      this.jwtCheck = jwt(
        {
          secret: new Buffer(secret, 'base64'),
          audience: audience
        }
      )

      expressApp.set('jwtCheck', this.jwtCheck)

      options.messages.info('Added JWT Express middleware')
      callback(null)
    } else {
      callback({
        name: 'authFail',
        message: 'Failed to set-up authentication middleware: Is $FLOBOT_AUTH_SECRET and $FLOBOT_AUTH_AUDIENCE set?'
      })
    }
  }

  /**
   * Extracts a userID from an Express request object
   * @param {Object} req An Express.js request object
   * @returns {String} A userId extracted from the request (derived via the `user` property added via [express-jwt](https://www.npmjs.com/package/express-jwt) middleware)
   * @example
   * var userId = auth.extractUserIdFromRequest (req)
   * console.log(userId) // myUsername@flobotjs.io
   */
  extractUserIdFromRequest (req) {
    let userId
    if (req.hasOwnProperty('user')) {
      userId = req.user.sub
    }
    return userId
  }
}

module.exports = {
  serviceClass: AuthService,
  bootAfter: ['server'],
  schema: schema
}
