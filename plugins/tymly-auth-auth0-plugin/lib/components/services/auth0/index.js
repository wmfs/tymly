'use strict'

const request = require('request')
const boom = require('boom')
const debug = require('debug')('tymly-auth-auth0-plugin')

class Auth0Service {
  boot (options, callback) {
    if (process.env.TYMLY_AUTH_DOMAIN) {
      this.auth0GetManagementAPIAccessTokenUrl = `https://${process.env.TYMLY_AUTH_DOMAIN}/oauth/token`
      this.auth0Audience = `https://${process.env.TYMLY_AUTH_DOMAIN}/api/v2/`
      this.auth0GetUsersByIdUrlPrefix = `${this.auth0Audience}users/`
      this.auth0GetUsersByEmailUrl = `${this.auth0Audience}users-by-email`
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
        method: 'POST',
        url: this.auth0GetManagementAPIAccessTokenUrl,
        headers: {
          'content-type': 'application/json'
        },
        body: {
          grant_type: 'client_credentials',
          client_id: this.auth0ClientId,
          client_secret: this.auth0ClientSecret,
          audience: this.auth0Audience
        },
        json: true
      }

      request(options, function (err, response, body) {
        if (err) {
          callback(boom.boomify(err, { message: 'An unexpected error occurred whilst acquiring an access token' }))
        } else if (body.error && body.error_description) {
          callback(boom.boomify(new Error(body.error_description)))
        } else {
          debug('access jwt:', JSON.stringify(body))
          if (body.access_token && body.token_type && body.token_type === 'Bearer') {
            callback(null, body)
          }
        }
      })
    }
  }

  getEmailFromUserId (userId, callback) {
    this._getAccessJWT(function (err, jwt) {
      if (err) {
        callback(err)
      } else {
        const options = {
          method: 'GET',
          url: `${this.auth0GetUsersByIdUrlPrefix}${userId}`,
          headers: {
            authorization: `Bearer ${jwt.access_token}`
          }
        }

        request(options, function (err, response, body) {
          if (err) {
            callback(boom.boomify(err, { message: 'An unexpected error occurred whilst attempting to convert a user id into an email address' }))
          } else if (!body.email) {
            callback(boom.boomify(new Error(body)))
          } else {
            debug(`user ${userId}:`, JSON.stringify(body))
            callback(null, body.email)
          }
        })
      }
    })
  }

  getUserIdFromEmail (email, callback) {
    this._getAccessJWT(function (err, jwt) {
      if (err) {
        callback(err)
      } else {
        const options = {
          method: 'GET',
          url: this.auth0GetUsersByEmailUrl,
          qs: {
            email: email
          },
          headers: {
            authorization: `Bearer ${jwt.access_token}`
          }
        }

        request(options, function (err, response, body) {
          if (err) {
            callback(boom.boomify(err, { message: 'An unexpected error occurred whilst attempting to convert an email address into a user id' }))
          } else if (!body.user_id) {
            callback(boom.boomify(new Error(body)))
          } else {
            debug(`user ${email}:`, JSON.stringify(body))
            callback(null, body.user_id)
          }
        })
      }
    })
  }
}

module.exports = {
  serviceClass: Auth0Service,
  bootBefore: ['tymly', 'rbac']
}
