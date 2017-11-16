'use strict'

class ApplySettings {
  init (resourceConfig, env, callback) {
    this.settings = env.bootedServices.storage.models['tymly_settings']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    const newCategoryRelevance = event.categoryRelevance
    this.settings.upsert(
      {
        userId: userId,
        categoryRelevance: newCategoryRelevance
      },
      {}
    ).then(() => {
      context.sendTaskSuccess()
    }).catch(err => context.sendTaskFailure(err))
  }
}

module.exports = ApplySettings
