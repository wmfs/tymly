'use strict'

const _ = require('lodash')
const dottie = require('dottie')

module.exports = class SetContextData {
  init (resourceConfig, env, callback) {
    this.resourceConfig = resourceConfig
    callback(null)
  }

  run (event, context) {
    const FORM_DATA_STRING_LENGTH = 8
    const data = {}

    Object.keys(this.resourceConfig).map(key => {
      let dottiePath
      let theKey
      if (_.isString(key) && key.length > 0) {
        dottiePath = key
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

      if (this.resourceConfig[key] === '$NOW') {
        this.resourceConfig[key] = new Date().toISOString()
      } else if (this.resourceConfig[key] === '$USERID') {
        this.resourceConfig[key] = context.userId
      }

      dottie.set(data, theKey, this.resourceConfig[key])
    })
    context.sendTaskSuccess(data)
  }
}
