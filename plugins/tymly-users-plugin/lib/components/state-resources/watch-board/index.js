'use strict'

class WatchBoard {
  init (resourceConfig, env, callback) {
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards']
    callback(null)
  }

  run (event, context) {
    let feedName = [event.stateMachineName]
    if (event.key) Object.keys(event.key).sort().map(k => feedName.push(event.key[k]))
    feedName = feedName.join('|')

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
