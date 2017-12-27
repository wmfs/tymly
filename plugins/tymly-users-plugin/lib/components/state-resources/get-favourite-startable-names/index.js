'use strict'

class GetFavouriteStartableNames {
  init (resourceConfig, env, callback) {
    this.favouringStartableStateMachines = env.bootedServices.storage.models['tymly_favouringStartableStateMachines']
    callback(null)
  }

  run (event, context) {
    this.favouringStartableStateMachines.find({
      where: {userId: {equals: context.userId}}
    })
      .then(results => context.sendTaskSuccess({results}))
      .catch(err => context.sendTaskFailure({error: 'getFavouriteStartableNamesFail', cause: err}))
  }
}

module.exports = GetFavouriteStartableNames
