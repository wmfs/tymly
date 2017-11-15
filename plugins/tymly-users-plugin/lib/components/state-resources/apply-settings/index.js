'use strict'

/*
* TODO: What should this return in the context?
* TODO: Handle failure if notification not found (look at tymly-mock-api)
* TODO: pg-model and tymly/storage/memory-model need to handle dates
* */

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
