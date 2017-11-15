'use strict'

/*
* TODO: userRemit needs to contain settings & favouriteStartableNames
* */

class GetUserRemit {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    // const userId = context.userId;
    context.sendTaskSuccess()
  }
}

module.exports = GetUserRemit
