'use strict'

/*
* TODO: userRemit needs to contain settings & favouriteStartableNames
* */

class GetUserRemit {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    const settings = event.userSettings.results[0].categoryRelevance
    const favourites = event.favourites.results[0].stateMachineNames
    // const userId = context.userId;
    let executionDescription = {
      ctx: {
        userRemit: {
          add: {
            boardNames: {},
            categoryNames: {},
            teamNames: {},
            todoExecutionNames: {},
            formNames: {},
            startable: {}
          },
          remove: {
            boardNames: [],
            categoryNames: [],
            teamNames: [],
            todoExecutionNames: [],
            formNames: [],
            startable: []
          },
          settings: settings,
          favouriteStartableNames: favourites
        }
      }
    }
    context.sendTaskSuccess(executionDescription)
  }
}

module
  .exports = GetUserRemit
