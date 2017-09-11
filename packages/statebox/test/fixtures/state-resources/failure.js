'use strict'

module.exports = class Failure {
  run (event, context) {
    context.sendTaskFailure(
      {
        error: 'SomethingBadHappened',
        cause: 'But at least it was expected'
      }
    )
  }
}
