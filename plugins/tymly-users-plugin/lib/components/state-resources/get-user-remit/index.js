'use strict'

/*
* TODO: Where does user ID come from? Will it come from env?
* */

class GetUserRemit {
  init (resourceConfig, env, callback) {
    this.userId = 'user2'
    this.client = env.bootedServices.storage.client
    callback(null)
  }

  run (event, context) {
    // const schemaName = context.stateMachineMeta.schemaName
    context.sendTaskSuccess()
  }
}

module.exports = GetUserRemit
