'use strict'

class UnwatchBoard {
  init (resourceConfig, env, callback) {
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards']
    callback(null)
  }

  run (event, context) {
    this.watchedBoards.destroyById(event.subscriptionId)
      .then(() => context.sendTaskSuccess())
      .catch(err => context.sendTaskFailure({error: 'unwatchBoardFail', cause: err}))
  }
}

module.exports = UnwatchBoard
