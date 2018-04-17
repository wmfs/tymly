'use strict'

const _ = require('lodash')
const dottie = require('dottie')
const jp = require('jsonpath')

module.exports = class SetContextData {
  init (resourceConfig, env, callback) {
    this.resourceConfig = resourceConfig
    this.auth0Service = env.bootedServices.auth0
    callback(null)
  }

  run (event, context) {
    const FORM_DATA_STRING_LENGTH = 8
    const config = {}
    const data = {}

    const setters = Object.keys(this.resourceConfig).map(key => {
      let theKey
      if (_.isString(key) && key.length > 0) {
        let dottiePath = key

        if (dottiePath[0] === '$') {
          dottiePath = dottiePath.slice(1)
        }

        if (dottiePath[0] === '.') {
          dottiePath = dottiePath.slice(1)
          theKey = dottiePath
        }

        if (dottiePath.substring(0, FORM_DATA_STRING_LENGTH) === 'formData') {
          dottiePath = dottiePath.slice(FORM_DATA_STRING_LENGTH + 1)
        }
      }

      if (_.isString(this.resourceConfig[key]) && this.resourceConfig[key].substring(0, 2) === '$.') {
        config[key] = jp.value(event, this.resourceConfig[key])
      } else if (this.resourceConfig[key] === '$NOW') {
        config[key] = new Date().toISOString()
      } else if (this.resourceConfig[key] === '$USERID') {
        config[key] = context.userId
      } else if (this.resourceConfig[key] === '$EMAIL') {
        if (this.auth0Service) {
          return new Promise((resolve, reject) => {
            this.auth0Service.getEmailFromUserId(context.userId, (err, email) => {
              if (err) {
                config[key] = ''
              } else {
                config[key] = email
              }
              dottie.set(data, theKey, config[key])
              resolve()
            })
          })
        } else {
          config[key] = ''
        }
      } else {
        config[key] = this.resourceConfig[key]
      }
      dottie.set(data, theKey, config[key])
    })

    Promise.all(setters)
      .then(() => context.sendTaskSuccess(data))
  }
}
