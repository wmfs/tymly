'use strict'

class GetFavouriteStartableNames {
  init (resourceConfig, env, callback) {
    this.settings = env.bootedServices.storage.models['tymly_settings']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    console.log('!!!!' + userId)
    context.sendTaskSuccess()
  }
}

module.exports = GetFavouriteStartableNames
