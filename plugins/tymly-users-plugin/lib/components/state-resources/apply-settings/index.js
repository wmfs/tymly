'use strict'

class ApplySettings {
  init (resourceConfig, env, callback) {
    this.settings = env.bootedServices.storage.models['tymly_settings']
    callback(null)
  }

  run (event, context) {
    this.settings.upsert({userId: context.userId, categoryRelevance: event.categoryRelevance}, {})
      .then(() => context.sendTaskSuccess())
      .catch((err) => context.sendTaskFailure(err))
  }
}

module.exports = ApplySettings
