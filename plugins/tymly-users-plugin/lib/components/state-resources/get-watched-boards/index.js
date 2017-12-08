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
          context.sendTaskFailure({error: 'getWatchedBoardsFail', cause: err})
        }

        const ctx = {
          watchCategories: {}
        }

        const categories = new Set()
        results.map(r => categories.add(r.category))
        categories.forEach(c => {
          ctx.watchCategories[c] = {
            total: 0,
            subscriptions: []
          }
        })

        results.map(r => {
          ctx.watchCategories[r.category].total++
          ctx.watchCategories[r.category].subscriptions.push(
            {
              subscriptionId: r.id,
              feedName: r.feedName,
              title: r.title,
              description: r.description,
              startedWatching: r.startedWatching,
              launches: r.launches
            }
          )
        })

        context.sendTaskSuccess(ctx)
      }
    )
  }
}

module.exports = GetWatchedBoards
