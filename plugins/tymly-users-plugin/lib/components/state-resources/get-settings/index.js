'use strict'

// const async = require('async')

/*
* TODO: Where does user ID come from? Will it come from env?
* TODO: Have a model in the test/fixtures blueprint rather than produce tables via SQL, the problem atm is the UUID
* */

class GetSettings {
  init (resourceConfig, env, callback) {
    this.settings = env.bootedServices.storage.models['tymly_settings']
    this.categoryService = env.bootedServices.categories
    callback(null)
  } // init

  run (event, context) {
    const userId = context.userId
    this.settings.findOne({
      where: {
        userId: {equals: userId}
      }
    })
      .then(settings => {
        const results = settings || { userId: userId }
        if (!results.categoryRelevance) {
          results.categoryRelevance = this.categoryService.names
        }

        context.sendTaskSuccess({results})
      })
      .catch(err => {
        console.log('ERROR')
        context.sendTaskFailure({
          error: 'getSettingsFail',
          cause: err
        })
      })
  } // run
}

module.exports = GetSettings
