'use strict'
const _ = require('lodash')
const dottie = require('dottie')
module.exports = class SetContextData {
  init (resourceConfig, env, callback) {
    this.resourceConfig = resourceConfig
    callback(null)
  }

  run (event, context) {
    // const data = _.cloneDeep(this.resourceConfig)
    const data = {}
    for (const key in this.resourceConfig) {
      let dottiePath
      let theKey
      if (_.isString(key)) {
        dottiePath = key
        if (dottiePath.length > 0) {
          if (dottiePath[0] === '$') {
            dottiePath = dottiePath.slice(1)
          }
        }
        if (dottiePath.length > 0) {
          if (dottiePath[0] === '.') {
            dottiePath = dottiePath.slice(1)
            theKey = dottiePath
          }
        }
        if (dottiePath.length > 0) {
          if (dottiePath.substring(0, 8) === 'formData') {
            dottiePath = dottiePath.slice(9)
          }
        }
      }
      dottie.set(data, theKey, this.resourceConfig[key])
    }
    console.log(data)
    context.sendTaskSuccess(data)
  }
}
