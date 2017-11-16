'use strict'

// const dottie = require('dottie')

class GetFavouriteStartableNames {
  init (resourceConfig, env, callback) {
    this.favouringStartableStateMachines = env.bootedServices.storage.models['tymly_favouringStartableStateMachines']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    // let executionDescription = {}
    this.favouringStartableStateMachines.find(
      {
        where: {
          userId: {equals: userId}
        }
      },
      (err, results) => {
        if (err) {
          console.log('ERROR')
          context.sendTaskFailure(
            {
              error: 'getFavouriteStartableNamesFail',
              cause: err
            }
          )
        } else {
          // dottie.set(executionDescription, 'favouriteStartableNames', results)
          context.sendTaskSuccess({results})
        }
      }
    )
  }
}

module.exports = GetFavouriteStartableNames
