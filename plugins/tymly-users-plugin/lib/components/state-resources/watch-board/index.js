'use strict'

class WatchBoard {
  init (resourceConfig, env, callback) {
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards']
    callback(null)
  }

  run (event, context) {
    const feedName = event.stateMachineName + '|' + event.key.incidentNumber + '|' + event.key.incidentYear
    const startedWatching = new Date().toLocaleString()

    this.watchedBoards.upsert(
      {
        userId: context.userId,
        feedName: feedName,
        title: event.title,
        description: event.description,
        startedWatching: startedWatching
      },
      {}
    )
      .then((doc) => {
        context.sendTaskSuccess({
          subscriptionId: doc.idProperties.id,
          feedName: feedName,
          startedWatching: startedWatching
        })
      })
      .catch(err => context.sendTaskFailure(err))
  }
}

module.exports = WatchBoard
