'use strict'
// const _ = require('lodash')
// const jsonPath = require('jsonpath')
module.exports = class SetContextData {
  init (resourceConfig, env, callback) {
    this.resourceConfig = resourceConfig
    callback(null)
  }

  run (event, context) {
    console.log('!!!', this.resourceConfig)
    // const data = _.cloneDeep(this.resourceConfig)
    const data = {}
    for (const key in this.resourceConfig) {
      console.log('key', key)
      console.log('value', this.resourceConfig[key])
    }
    context.sendTaskSuccess(data)
  }
}
