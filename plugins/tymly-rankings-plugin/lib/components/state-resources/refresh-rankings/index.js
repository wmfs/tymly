'use strict'

const getFunction = require('tymly/lib/getFunction.js')

class RefreshView {
  init (resourceConfig, env, callback) {
    console.log('Init table')
    this.client = env.bootedServices.storage.client
    this.source = resourceConfig.source
    this.target = resourceConfig.target
    this.join = resourceConfig.join
    this.transformFunction = getFunction(
      env,
      resourceConfig.transformerFunctionName
    )
    callback(null)
  }

  run (event, context) {
    console.log('Enter table')
  }
}

module.exports = RefreshView
