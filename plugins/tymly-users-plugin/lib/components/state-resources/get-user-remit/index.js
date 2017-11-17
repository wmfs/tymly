'use strict'

/*
* TODO: compare the client manifest to 'components' from DB in order to produce the adds/removes
* */

class GetUserRemit {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    // const userId = context.userId
    // const clientManifest = event.clientManifest // things currently present on client device
    let settings, favourites
    if (event.userSettings.results.length > 0) settings = event.userSettings.results[0].categoryRelevance
    if (event.favourites.results.length > 0) favourites = event.favourites.results[0].stateMachineNames

    let userRemit = {
      add: {},
      remove: {},
      settings: settings,
      favouriteStartableNames: favourites
    }
    context.sendTaskSuccess({userRemit})
  }
}

module.exports = GetUserRemit
