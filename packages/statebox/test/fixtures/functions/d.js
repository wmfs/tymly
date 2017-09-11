'use strict'

module.exports = function d (event, context) {
  const list = event.results
  console.log('D')
  list.push('D')
  context.sendTaskSuccess({results: list})
}
