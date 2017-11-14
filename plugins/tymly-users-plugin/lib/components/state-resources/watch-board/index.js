'use strict'

/*
* TODO: Where does user ID come from? Will it come from env?
* TODO: Have a model in the test/fixtures blueprint rather than produce tables via SQL, the problem atm is the UUID
* TODO: Boards should be categorized - this will affect implementation here
* */

class WatchBoard {
  init (resourceConfig, env, callback) {
    console.log('>>> init watch boards')
    callback(null)
  }

  run (event, context) {
    console.log('>>> running watch boards')
    // Insert a 'subscription' to the database for the given user and board to watch (board details come from event)
    context.sendTaskSuccess()
  }
}

module.exports = WatchBoard
