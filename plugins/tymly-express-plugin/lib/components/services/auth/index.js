'use strict'

const boom = require('boom')
const process = require('process')
const dottie = require('dottie')
const jwt = require('express-jwt')
const schema = require('./schema.json')
const Buffer = require('safe-buffer').Buffer
const _ = require('lodash')
const fs = require('fs')

class AuthService {
  boot (options, callback) {
    // Need to find secret/audience.
    // Take from config.auth, and failing that environment variables.

    let configOk = true

    let secret = dottie.get(options, 'config.auth.secret')

    if (secret === undefined && _.isString(process.env.TYMLY_CERTIFICATE_PATH)) {
      // TODO: Make this a bit better
      secret = fs.readFileSync(process.env.TYMLY_CERTIFICATE_PATH)
    }

    if (secret === undefined) {
      secret = process.env.TYMLY_AUTH_SECRET
      secret = new Buffer(secret, 'base64')
    }

    if (secret === undefined) {
      configOk = false
      options.messages.error(
        {
          name: 'noSecret',
          message: 'No authentication secret was supplied via config or the $TYMLY_AUTH_SECRET environment variable'
        }
      )
    }

    let audience = dottie.get(options, 'config.auth.audience')
    if (audience === undefined) {
      audience = process.env.TYMLY_AUTH_AUDIENCE
    }

    if (audience === undefined) {
      configOk = false
      options.messages.error(
        {
          name: 'noAudience',
          message: 'No authentication audience was supplied via config or the $TYMLY_AUTH_AUDIENCE environment variable'
        }
      )
    }

    if (configOk) {
      const expressApp = options.bootedServices.server.app
      this.jwtCheck = jwt(
        {
          secret: secret,
          audience: audience
        }
      )
      expressApp.set('jwtCheck', this.jwtCheck)

      options.messages.info('Added JWT Express middleware')
      callback(null)
    } else {
      console.error('Failed to set-up authentication middleware: Is $TYMLY_AUTH_SECRET and $TYMLY_AUTH_AUDIENCE set?')
      callback(boom.internal('Failed to set-up authentication middleware: Is $TYMLY_AUTH_SECRET and $TYMLY_AUTH_AUDIENCE set?'))
    }
  }

  /**
   * Extracts a userID from an Express request object
   * @param {Object} req An Express.js request object
   * @returns {String} A userId extracted from the request (derived via the `user` property added via [express-jwt](https://www.npmjs.com/package/express-jwt) middleware)
   * @example
   * var userId = auth.extractUserIdFromRequest (req)
   * console.log(userId) // myUsername@tymlyjs.io
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
