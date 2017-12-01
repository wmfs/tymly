'use strict'

class WatchBoard {
  init (resourceConfig, env, callback) {
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards']
    callback(null)
  }

  run (event, context) {
    const feedName = event.stateMachineName + '|' + event.key.incidentNumber + '|' + event.key.incidentYear

    this.watchedBoards.upsert(
      {
        userId: context.userId,
        feedName: feedName,
        title: event.title,
        description: event.description,
        startedWatching: new Date().toLocaleString()
      },
      {}
    )
      .then(() => {
        this.watchedBoards.findOne(
          {
            where: {
              userId: {equals: context.userId},
              feedName: {equals: feedName},
              title: {equals: event.title},
              description: {equals: event.description}
            }
          }
        )
          .then((doc) => {
            context.sendTaskSuccess({
              subscriptionId: doc.id,
              feedName: doc.feedName,
              startedWatching: doc.startedWatching
            })
          })
          .catch(err => context.sendTaskFailure(err))
      })
      .catch(err => context.sendTaskFailure(err))
  }
}

module.exports = WatchBoard
