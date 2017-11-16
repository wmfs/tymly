'use strict'

class WatchBoard {
  init (resourceConfig, env, callback) {
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    const feedName = event.stateMachineName + '|' + event.key.incidentNumber + '|' + event.key.incidentYear

    this.watchedBoards.upsert(
      {
        userId: userId,
        feedName: feedName,
        title: event.title,
        description: event.description,
        startedWatching: new Date().toLocaleString()
      },
      {}
    ).then(() => {
      context.sendTaskSuccess()
    }).catch(err => context.sendTaskFailure(err))
  }
}

module.exports = WatchBoard
