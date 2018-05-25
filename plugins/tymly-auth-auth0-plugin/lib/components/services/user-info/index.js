'use strict'

const request = require('request')
const boom = require('boom')
const debug = require('debug')('tymly-auth-plugin')

const USER_ID_TO_EMAIL_CACHE_NAME = 'userIdToEmail'
const USER_ID_TO_GROUPS_CACHE_NAME = 'userIdToGroups'
const EMAIL_TO_USER_ID_CACHE_NAME = 'emailToUserId'
const THIRTY_MINUTES_IN_MILLISECONDS = 1800000

class Auth0Service {
  boot (options, callback) {
    options.messages.info('Auth0 User Information')

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
    this.cacheService.defaultIfNotInConfig(USER_ID_TO_GROUPS_CACHE_NAME, cacheOptions)
    this.cacheService.defaultIfNotInConfig(EMAIL_TO_USER_ID_CACHE_NAME, cacheOptions)

    if (process.env.PROXY_URL) {
      this.request = request.defaults({'proxy': process.env.PROXY_URL})
    } else {
      this.request = request.defaults()
    }

    callback(null)
  }

  /**
   * Converts a provider user id into an email address, via an auth0 web api
   * @param {string} userId a provider use id
   * @param callback callback function, whose first parameter holds error details or {undefined}, and whose second parameter holds the email address returned by the auth0 web api
   * @returns {undefined}
   */
  async emailFromUserId (userId) {
    const email = this.cacheService.get(USER_ID_TO_EMAIL_CACHE_NAME, userId)
    if (email) {
      return email
    }

    const url = `${this.auth0GetUsersByIdUrlPrefix}/${userId}`
    const jwt = await this._managementAPIAccessToken()

    const [response, body] = await this._makeRequest({
      method: 'GET',
      url: url,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${jwt.access_token}`
      },
      json: true,
      timeout: this.webAPITimeoutInMilliseconds
    })

    if (body.email) {
      this._addToCache(userId, body.email)
      return body.email
    }

    if (body.statusCode && body.error && body.message && body.errorCode) {
      throw body
    }

    if (body) {
      throw boom.boomify(new Error(`Invalid response from ${url}`), {
        message: JSON.stringify(body)
      })
    }

    debug(`auth0 response status code from ${url}:`, response && response.statusCode)
    throw boom.boomify(new Error(`No response from ${url}`))
  } // emailFromUserId

  /**
   * Converts an email address into a provider user id, via an auth0 web api
   * @param {string} email a users email address
   * @param callback callback function, whose first parameter holds error details or {undefined}, and whose second parameter holds the user id returned by the auth0 web api
   * @returns {undefined}
   */
  async userIdFromEmail (email) {
    const userId = this.cacheService.get(EMAIL_TO_USER_ID_CACHE_NAME, email)
    if (userId) {
      return userId
    }

    const url = this.auth0GetUsersByEmailUrl
    const jwt = await this._managementAPIAccessToken()

    const [response, body] = await this._makeRequest({
      method: 'GET',
      url: url,
      qs: {
        email: email
      },
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${jwt.access_token}`
      },
      json: true,
      timeout: this.webAPITimeoutInMilliseconds
    })

    if (body && body.length === 1 && body[0].user_id) {
      this._addToCache(body[0].user_id, email)
      return body[0].user_id
    }

    if (body && body.length === 0) {
      throw boom.notFound('The user does not exist.')
    }

    if (body) {
      throw boom.boomify(new Error(`Invalid response from ${this.auth0GetUsersByEmailUrl}`), {
        message: JSON.stringify(body)
      })
    }

    debug(`auth0 response status code from ${this.auth0GetUsersByEmailUrl}:`, response && response.statusCode)
    throw boom.boomify(new Error(`No response from ${this.auth0GetUsersByEmailUrl}`))
  } // userIdFromEmail

  async groupsFromUserId (userId) {
    const groups = this.cacheService.get(USER_ID_TO_GROUPS_CACHE_NAME, userId)
    if (groups) {
      return groups
    }

    const url = `${this.auth0GetUsersByIdUrlPrefix}/${userId}`
    const jwt = await this._managementAPIAccessToken()

    const [response, body] = await this._makeRequest({
      method: 'GET',
      url: url,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${jwt.access_token}`
      },
      json: true,
      timeout: this.webAPITimeoutInMilliseconds
    })

    if (body.groups) {
      this._addToCache(userId, null, body.groups)
      return body.groups
    }

    if (body.statusCode && body.error && body.message && body.errorCode) {
      throw body
    }

    if (body) {
      this._addToCache(userId, null, [])
      return []
    }

    debug(`auth0 response status code from ${url}:`, response && response.statusCode)
    throw boom.boomify(new Error(`No response from ${url}`))
  } // groupsFromUserId

  _addToCache (userId, email, groups) {
    this.cacheService.set(EMAIL_TO_USER_ID_CACHE_NAME, email, userId)
    this.cacheService.set(USER_ID_TO_EMAIL_CACHE_NAME, userId, email)
    this.cacheService.set(USER_ID_TO_GROUPS_CACHE_NAME, userId, groups)
  } // _addToCache

  _makeRequest (options) {
    return new Promise((resolve, reject) => {
      this.request(
        options,
        (err, response, body) => {
          if (err) return reject(err)
          resolve([response, body])
        }
      )
    })
  } // _makeRequest

  async _managementAPIAccessToken () {
    if (!this.auth0Audience) {
      throw boom.unauthorized('auth0 domain has not been configured (the TYMLY_NIC_AUTH0_DOMAIN environment variable is not set)')
    } else if (!this.auth0ClientId) {
      throw boom.unauthorized('auth0 client id has not been configured (the TYMLY_NIC_AUTH0_CLIENT_ID environment variable is not set)')
    } else if (!this.auth0ClientSecret) {
      throw boom.unauthorized('auth0 client secret has not been configured (the TYMLY_NIC_AUTH0_CLIENT_SECRET environment variable is not set)')
    }

    const [response, body] = await this._makeRequest({
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
      timeout: this.webAPITimeoutInMilliseconds
    })
    if (body.access_token && body.token_type && body.token_type === 'Bearer') {
      return body
    }

    if (body.statusCode && body.error && body.message && body.errorCode) {
      throw body
    }

    if (body) {
      throw boom.boomify(new Error(`Invalid response from ${this.auth0GetManagementAPIAccessTokenUrl}`), {
        message: JSON.stringify(body)
      })
    }

    debug(`auth0 response status code from ${this.auth0GetManagementAPIAccessTokenUrl}:`, response && response.statusCode)
    throw boom.boomify(new Error('No response from auth0'))
  } // _managementAPIAccessToken
} // class Auth0Service

module.exports = {
  serviceClass: Auth0Service,
  bootBefore: ['tymly', 'rbac'],
  bootAfter: ['caches']
}
