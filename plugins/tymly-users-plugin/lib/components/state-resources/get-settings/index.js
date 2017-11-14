'use strict'

const dottie = require('dottie')
// const async = require('async')

/*
* TODO: Where does user ID come from? Will it come from env?
* TODO: Have a model in the test/fixtures blueprint rather than produce tables via SQL, the problem atm is the UUID
* */

class GetSettings {
  init (resourceConfig, env, callback) {
    this.userId = 'testuser2'
    this.settings = env.bootedServices.storage.models['tymly_settings']
    callback(null)
  }

  run (event, context) {
    let executionDescription = {}
    this.settings.find(
      {
        where: {
          userId: {equals: this.userId}
        }
      },
      (err, results) => {
        if (err) {
          console.log('ERROR')
          context.sendTaskFailure(
            {
              error: 'getSettingsFail',
              cause: err
            }
          )
        } else {
          dottie.set(executionDescription, 'userSettings', results)
          context.sendTaskSuccess({results})
        }
      }
    )
  }
}

module.exports = GetSettings
