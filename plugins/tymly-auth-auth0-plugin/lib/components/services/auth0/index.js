'use strict'

const request = require('request')
const boom = require('boom')

const AUTH0_GRANT_TYPE = 'client_credentials'
const AUTH0_REQUEST_METHOD = 'POST'

class Auth0Service {
  boot (options, callback) {
    if (process.env.TYMLY_AUTH_DOMAIN) {
      this.auth0Audience = `https://${process.env.TYMLY_AUTH_DOMAIN}/api/v2/`
      this.auth0GetManagementAPIAccessTokenUrl = `https://${process.env.TYMLY_AUTH_DOMAIN}/oauth/token`
    }

    if (process.env.TYMLY_AUTH_CLIENT_ID) {
      this.auth0ClientId = process.env.TYMLY_AUTH_CLIENT_ID
    }

    if (process.env.TYMLY_AUTH_CLIENT_SECRET) {
      this.auth0ClientSecret = process.env.TYMLY_AUTH_CLIENT_SECRET
    }

    callback(null)
  }

  _getAccessJWT (callback) {
    if (!this.auth0Audience) {
      callback(boom.unauthorized('auth0 domain has not been setup in the TYMLY_AUTH_DOMAIN environment variable'))
    } else if (!this.auth0ClientId) {
      callback(boom.unauthorized('auth0 client id has not been setup in the TYMLY_AUTH_CLIENT_ID environment variable'))
    } else if (!this.auth0ClientSecret) {
      callback(boom.unauthorized('auth0 client secret has not been setup in the TYMLY_AUTH_CLIENT_SECRET environment variable'))
    } else {
      const options = {
        method: AUTH0_REQUEST_METHOD,
        url: this.auth0GetManagementAPIAccessTokenUrl,
        headers: {
          'content-type': 'application/json'
        },
        body: {
          grant_type: AUTH0_GRANT_TYPE,
          client_id: this.auth0ClientId,
          client_secret: this.auth0ClientSecret,
          audience: this.auth0Audience
        },
        json: true
      }

      request(options, function (err, response, body) {
        if (err) {
          callback(boom.boomify(err, { message: 'An unexpected error occurred whilst acquiring an access token' }))
        }

        if (body.error) {
          if (body.error_description) {
            callback(boom.boomify(new Error(body.error_description)))
          } else {
            callback(boom.boomify(new Error(body)))
          }
        }

        callback(null, body)
      })
    }
  }

  getEmailFromUserId (userId, callback) {
    this._getAccessJWT(function (err, jwt) {
      if (err) {
        callback(err)
      }

      callback(null, jwt)
    })
  }

  getUserIdFromEmail (email, callback) {
    callback(null)
  }
}

module.exports = {
  serviceClass: Auth0Service,
  bootBefore: ['tymly', 'rbac']
}
