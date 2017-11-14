'use strict'

// const dottie = require('dottie')
// const async = require('async')

/*
* TODO: Where does user ID come from? Will it come from env?
* TODO: Have a model in the test/fixtures blueprint rather than produce tables via SQL, the problem atm is the UUID
* */

class GetSettings {
  init (resourceConfig, env, callback) {
    this.userId = 'user2'
    this.client = env.bootedServices.storage.client
    callback(null)
  }

  run (event, context) {
    // const _client = this.client
    // const schemaName = context.stateMachineMeta.schemaName
    // let executionDescription = {}
    // let payload = {}
  }
}

module.exports = GetSettings
