'use strict'

/*
* TODO: Where does user ID come from? Will it come from env?
* */

class WatchBoard {
  init (resourceConfig, env, callback) {
    this.userId = 'user2'
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards']
    callback(null)
  }

  run (event, context) {
    const feedName = event.stateMachineName + '|' + event.key.incidentNumber + '|' + event.key.incidentYear

    this.watchedBoards.create(
      {
        userId: this.userId,
        feedName: feedName,
        title: event.title,
        description: event.description
      },
      {},
      function (err, idProperties) {
        console.log('idProperties:', idProperties)
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
      }
    )
  }
}

module.exports = WatchBoard
