'use strict'

/*
* TODO: compare the client manifest to things in order to produce the adds/removes
* */

class GetUserRemit {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    // const userId = context.userId;
    const settings = event.userSettings.results[0].categoryRelevance
    const favourites = event.favourites.results[0].stateMachineNames
    let executionDescription = {
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
    context.sendTaskSuccess(executionDescription)
  }
}

module.exports = GetUserRemit
