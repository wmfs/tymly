'use strict'

module.exports = class Failure {
  init (resourceConfig, env, callback) {
    callback(null)
  }

  run (event, context) {
    context.sendTaskFailure(
      {
        error: 'SomethingBadHappened',
        cause: 'But at least it was expected'
      }
    )
  }
}
