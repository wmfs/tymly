'use strict'

/*
* TODO: Where does user ID come from? Will it come from env?
* TODO: Have a model in the test/fixtures blueprint rather than produce tables via SQL, the problem atm is the UUID
* TODO: Boards should be categorized - this will affect implementation here
* subscription_id should be a UUID so should be auto generated
* */

class WatchBoard {
  init (resourceConfig, env, callback) {
    this.userId = 'user2'
    this.client = env.bootedServices.storage.client
    callback(null)
  }

  run (event, context) {
    const schemaName = context.stateMachineMeta.schemaName
    const feedName = event.stateMachineName + '|' + event.key.incidentNumber + '|' + event.key.incidentYear
    const statement = `INSERT INTO ${schemaName}.watched_boards
    (user_id, feed_name, title, description, started_watching) VALUES
    ('${this.userId}', '${feedName}', '${event.title}', '${event.description}', '${(new Date()).toUTCString()}'::timestamp with time zone)`

    this.client.query(statement, (err) => {
      if (err) {
        context.sendTaskFailure(
          {
            error: 'watchBoardFail',
            cause: err
          }
        )
      } else {
        context.sendTaskSuccess()
      }
    })
  }
}

module.exports = WatchBoard
