'use strict'

class SetFavouriteStartableNames {
  init (resourceConfig, env, callback) {
    this.favouringStartableStateMachines = env.bootedServices.storage.models['tymly_favouringStartableStateMachines']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    const newStateMachineNames = event.stateMachineNames
    this.favouringStartableStateMachines.upsert(
      {
        userId: userId,
        stateMachineNames: newStateMachineNames
      },
      {}
    ).then(() => {
      context.sendTaskSuccess()
    }).catch(err => context.sendTaskFailure(err))
  }
}

module.exports = SetFavouriteStartableNames
