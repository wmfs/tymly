'use strict'

class WatchBoard {
  init (resourceConfig, env, callback) {
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards']
    callback(null)
  }

  run (event, context) {
    const userId = context.userId
    const feedName = event.stateMachineName + '|' + event.key.incidentNumber + '|' + event.key.incidentYear

    this.watchedBoards.create(
      {
        userId: userId,
        feedName: feedName,
        title: event.title,
        description: event.description,
        startedWatching: new Date().toLocaleString()
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
