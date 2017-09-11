'use strict'

module.exports = function hello (event, context) {
  context.sendTaskFailure(
    {
      error: 'SomethingBadHappened',
      cause: 'But at least it was expected'
    }
  )
}
