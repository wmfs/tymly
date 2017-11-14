'use strict'

/*
* TODO: Where does user ID come from? Will it come from env?
* TODO: Have a model in the test/fixtures blueprint rather than produce tables via SQL, the problem atm is the UUID
* TODO: Boards should be categorized - this will affect implementation here
* TODO: Test blueprint namespace should become tymly which will affect the sql scripts and this file where comments indicate
* TODO: Change all SQL statements to methods on this.watchedBoards
* */

class GetWatchedBoards {
  init (resourceConfig, env, callback) {
    this.userId = 'user2'
    this.client = env.bootedServices.storage.client
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards'] // When namespace changed to tymly in tests, change this
    callback(null)
  }

  run (event, context) {
    const schemaName = context.stateMachineMeta.schemaName // When namespace changed to tymly in tests, change this

    /*
    this.watchedBoards.find(
      {
        where: {
          userId: {equals: this.userId}
        }
      },
      (err, doc) => {
        console.log('>>>', doc)
      }
    )
    */

    this.client.query(`select * from ${schemaName}.watched_boards where user_id = '${this.userId}'`, (err, results) => {
      if (err) {
        context.sendTaskFailure(
          {
            error: 'getWatchedBoardsFail',
            cause: err
          }
        )
      } else {
        const subscriptions = results.rows.map(row => {
          return {
            subscriptionId: row.subscription_id,
            feedName: row.feed_name,
            title: row.title,
            description: row.description,
            startedWatching: row.started_watching
          }
        })

        context.sendTaskSuccess({
          total: subscriptions.length,
          subscriptions: subscriptions
        })
      }
    })
  }
}

module.exports = GetWatchedBoards