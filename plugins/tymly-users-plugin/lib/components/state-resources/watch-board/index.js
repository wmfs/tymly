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
    const title = event.title
    const description = event.description
    const key = event.key
    const feedName = event.stateMachineName + '|' + key.incidentNumber + '|' + key.incidentYear

    // Insert a 'subscription' to the database (tymly.watched_boards) for the given user and board to watch (board details come from event)

    const statement = `INSERT INTO ${schemaName}.watched_boards
    (user_id, feed_name, title, description, started_watching) VALUES
    ('${this.userId}', '${feedName}', '${title}', '${description}', '${(new Date()).toUTCString()}'::timestamp with time zone)`

    console.log(statement)
    context.sendTaskSuccess()
  }
}

module.exports = WatchBoard
