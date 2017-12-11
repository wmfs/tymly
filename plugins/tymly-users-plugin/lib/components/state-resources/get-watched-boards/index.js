'use strict'

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
          ctx.watchCategories[c] = {}
        })

        results.map(r => {
          if (!Object.keys(ctx.watchCategories[r.category]).includes(r.categoryLabel)) {
            ctx.watchCategories[r.category][r.categoryLabel] = {
              total: 0,
              subscriptions: []
            }
          }

          ctx.watchCategories[r.category][r.categoryLabel].total++
          ctx.watchCategories[r.category][r.categoryLabel].subscriptions.push(
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
