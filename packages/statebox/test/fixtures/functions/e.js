'use strict'

module.exports = function e (event, context) {
  const list = event.results
  console.log('E')
  list.push('E')
  context.sendTaskSuccess({results: list})
}
