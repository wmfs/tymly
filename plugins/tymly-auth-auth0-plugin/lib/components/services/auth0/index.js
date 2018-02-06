'use strict'

const request = require('request')
const boom = require('boom')

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

    callback(null)
  }

  getAccessJWT (callback) {
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
        json: true
      }, function (err, response, body) {
        if (err) {
          callback(boom.boomify(err, { message: 'An unexpected error occurred whilst acquiring an access token' }))
        } else if (body.error && body.error_description) {
          callback(boom.boomify(new Error(body.error_description)))
        } else {
          if (body.access_token && body.token_type && body.token_type === 'Bearer') {
            callback(null, body)
          } else if (body) {
            callback(boom.boomify(new Error('Invalid response from auth0'), { message: JSON.stringify(body) }))
          } else {
            callback(boom.boomify(new Error('No response from auth0')))
          }
        }
      })
    }
  }

  getEmailFromUserId (userId, callback) {
    const _this = this
    this.getAccessJWT(function (err, jwt) {
      if (err) {
        callback(err)
      } else {
        request({
          method: 'GET',
          url: `${_this.auth0GetUsersByIdUrlPrefix}/${userId}`,
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${jwt.access_token}`
          },
          json: true
        }, function (err, response, body) {
          if (err) {
            callback(boom.boomify(err, { message: 'An unexpected error occurred whilst attempting to convert a user id into an email address' }))
          } else if (body.email) {
            callback(null, body.email)
          } else if (body) {
            callback(boom.boomify(new Error('Invalid response from auth0'), { message: JSON.stringify(body) }))
          } else {
            callback(boom.boomify(new Error('No response from auth0')))
          }
        })
      }
    })
  }

  getUserIdFromEmail (email, callback) {
    const _this = this
    this.getAccessJWT(function (err, jwt) {
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
          json: true
        }, function (err, response, body) {
          if (err) {
            callback(boom.boomify(err, { message: 'An unexpected error occurred whilst attempting to convert an email address into a user id' }))
          } else if (body && body.length === 1 && body[0].user_id) {
            callback(null, body[0].user_id)
          } else if (body) {
            callback(boom.boomify(new Error('Invalid response from auth0'), { message: JSON.stringify(body) }))
          } else {
            callback(boom.boomify(new Error('No response from auth0')))
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
