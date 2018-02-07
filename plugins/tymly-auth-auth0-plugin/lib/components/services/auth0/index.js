'use strict'

const request = require('request')
const boom = require('boom')
const debug = require('debug')('tymly-auth-plugin')

const USER_ID_TO_EMAIL_CACHE_NAME = 'userIdToEmail'
const EMAIL_TO_USER_ID_CACHE_NAME = 'emailToUserId'
const THIRTY_MINUTES_IN_MILLISECONDS = 1800000

class Auth0Service {
  boot (options, callback) {
    if (process.env.TYMLY_NIC_AUTH0_DOMAIN) {
      this.auth0GetManagementAPIAccessTokenUrl = `https://${process.env.TYMLY_NIC_AUTH0_DOMAIN}/oauth/token`
      this.auth0Audience = `https://${process.env.TYMLY_NIC_AUTH0_DOMAIN}/api/v2/`
      this.auth0GetUsersByIdUrlPrefix = `${this.auth0Audience}users`
      this.auth0GetUsersByEmailUrl = `${this.auth0Audience}users-by-email`
    }

    if (process.env.TYMLY_NIC_AUTH0_CLIENT_ID) {
      this.auth0ClientId = process.env.TYMLY_NIC_AUTH0_CLIENT_ID
    }

    if (process.env.TYMLY_NIC_AUTH0_CLIENT_SECRET) {
      this.auth0ClientSecret = process.env.TYMLY_NIC_AUTH0_CLIENT_SECRET
    }

    this.webAPITimeoutInMilliseconds = (process.env.WEB_API_TIMEOUT_IN_MS || 3000)

    const cacheOptions = {
      max: (process.env.TYMLY_USER_CACHE_SIZE || 500),
      maxAge: (process.env.TYMLY_USER_CACHE_MAX_AGE_IN_MS || THIRTY_MINUTES_IN_MILLISECONDS)
    }

    this.cacheService = options.bootedServices.caches
    this.cacheService.defaultIfNotInConfig(USER_ID_TO_EMAIL_CACHE_NAME, cacheOptions)
    this.cacheService.defaultIfNotInConfig(EMAIL_TO_USER_ID_CACHE_NAME, cacheOptions)

    callback(null)
  }

  _getManagementAPIAccessToken (callback) {
    const _this = this
    if (!this.auth0Audience) {
      callback(boom.unauthorized('auth0 domain has not been configured (the TYMLY_NIC_AUTH0_DOMAIN environment variable is not set)'))
    } else if (!this.auth0ClientId) {
      callback(boom.unauthorized('auth0 client id has not been configured (the TYMLY_NIC_AUTH0_CLIENT_ID environment variable is not set)'))
    } else if (!this.auth0ClientSecret) {
      callback(boom.unauthorized('auth0 client secret has not been configured (the TYMLY_NIC_AUTH0_CLIENT_SECRET environment variable is not set)'))
    } else {
      request({
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
        json: true,
        timeout: _this.webAPITimeoutInMilliseconds
      }, function (err, response, body) {
        if (err) {
          callback(boom.boomify(err, {
            message: 'An unexpected error occurred whilst acquiring an access token'
          }))
        } else {
          if (body.access_token && body.token_type && body.token_type === 'Bearer') {
            callback(null, body)
          } else if (body.statusCode && body.error && body.message && body.errorCode) {
            callback(body)
          } else if (body) {
            callback(boom.boomify(new Error(`Invalid response from ${_this.auth0GetManagementAPIAccessTokenUrl}`), {
              message: JSON.stringify(body)
            }))
          } else {
            debug(`auth0 response status code from ${_this.auth0GetManagementAPIAccessTokenUrl}:`, response && response.statusCode)
            callback(boom.boomify(new Error('No response from auth0')))
          }
        }
      })
    }
  }

  /**
   * Converts a provider user id into an email address, via an auth0 web api
   * @param {string} userId a provider use id
   * @param callback callback function, whose first parameter holds error details or {undefined}, and whose second parameter holds the email address returned by the auth0 web api
   * @returns {undefined}
   */
  getEmailFromUserId (userId, callback) {
    const _this = this
    const email = this.cacheService.get(USER_ID_TO_EMAIL_CACHE_NAME, userId)
    if (email) {
      callback(null, email)
    } else {
      const url = `${_this.auth0GetUsersByIdUrlPrefix}/${userId}`
      this._getManagementAPIAccessToken(function (err, jwt) {
        if (err) {
          callback(err)
        } else {
          request({
            method: 'GET',
            url: url,
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${jwt.access_token}`
            },
            json: true,
            timeout: _this.webAPITimeoutInMilliseconds
          }, function (err, response, body) {
            if (err) {
              callback(boom.boomify(err, {
                message: 'An unexpected error occurred whilst attempting to convert a user id into an email address'
              }))
            } else {
              if (body.email) {
                _this._addToCache(userId, body.email)
                callback(null, body.email)
              } else if (body.statusCode && body.error && body.message && body.errorCode) {
                callback(body)
              } else if (body) {
                callback(boom.boomify(new Error(`Invalid response from ${url}`), {
                  message: JSON.stringify(body)
                }))
              } else {
                debug(`auth0 response status code from ${url}:`, response && response.statusCode)
                callback(boom.boomify(new Error(`No response from ${url}`)))
              }
            }
          })
        }
      })
    }
  }

  /**
   * Converts an email address into a provider user id, via an auth0 web api
   * @param {string} email a users email address
   * @param callback callback function, whose first parameter holds error details or {undefined}, and whose second parameter holds the user id returned by the auth0 web api
   * @returns {undefined}
   */
  getUserIdFromEmail (email, callback) {
    const _this = this
    const userId = this.cacheService.get(EMAIL_TO_USER_ID_CACHE_NAME, email)
    if (userId) {
      callback(null, userId)
    } else {
      this._getManagementAPIAccessToken(function (err, jwt) {
        if (err) {
          callback(err)
        } else {
          request({
            method: 'GET',
            url: _this.auth0GetUsersByEmailUrl,
            qs: {
              email: email
            },
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${jwt.access_token}`
            },
            json: true,
            timeout: _this.webAPITimeoutInMilliseconds
          }, function (err, response, body) {
            if (err) {
              callback(boom.boomify(err, {
                message: 'An unexpected error occurred whilst attempting to convert an email address into a user id'
              }))
            } else {
              if (body && body.length === 1 && body[0].user_id) {
                _this._addToCache(body[0].user_id, email)
                callback(null, body[0].user_id)
              } else if (body && body.length === 0) {
                callback(boom.notFound('The user does not exist.'))
              } else if (body) {
                callback(boom.boomify(new Error(`Invalid response from ${_this.auth0GetUsersByEmailUrl}`), {
                  message: JSON.stringify(body)
                }))
              } else {
                debug(`auth0 response status code from ${_this.auth0GetUsersByEmailUrl}:`, response && response.statusCode)
                callback(boom.boomify(new Error(`No response from ${_this.auth0GetUsersByEmailUrl}`)))
              }
            }
          })
        }
      })
    }
  }

  _addToCache (userId, email) {
    this.cacheService.set(EMAIL_TO_USER_ID_CACHE_NAME, email, userId)
    this.cacheService.set(USER_ID_TO_EMAIL_CACHE_NAME, userId, email)
  }
}

module.exports = {
  serviceClass: Auth0Service,
  bootBefore: ['tymly', 'rbac'],
  bootAfter: ['caches']
}
