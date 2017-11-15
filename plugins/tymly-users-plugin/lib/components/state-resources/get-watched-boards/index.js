'use strict'

/*
* TODO: Boards should be categorized - this will affect implementation here
* */

class GetWatchedBoards {
  init (resourceConfig, env, callback) {
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    this.watchedBoards.find(
      {
        where: {
          userId: {equals: userId}
        }
      },
      (err, results) => {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'getWatchedBoardsFail',
              cause: err
            }
          )
        } else {
          const subscriptions = results.map(r => {
            return {
              subscriptionId: r.id,
              feedName: r.feedName,
              title: r.title,
              description: r.description,
              startedWatching: r.startedWatching
            }
          })

          context.sendTaskSuccess({
            total: subscriptions.length,
            subscriptions: subscriptions
          })
        }
      }
    )
  }
}

module.exports = GetWatchedBoards
