'use strict'

class GetFavouriteStartableNames {
  init (resourceConfig, env, callback) {
    this.favouringStartableStateMachines = env.bootedServices.storage.models['tymly_favouringStartableStateMachines']
    callback(null)
  }

  run (event, context) {
    this.favouringStartableStateMachines
      .findOne({where: {userId: {equals: context.userId}}})
      .then(result => context.sendTaskSuccess({results: result ? result.stateMachineNames : []}))
      .catch(err => context.sendTaskFailure({error: 'getFavouriteStartableNamesFail', cause: err}))
  }
}

module.exports = GetFavouriteStartableNames
