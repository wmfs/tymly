'use strict'

module.exports = function d (event, context) {
  const list = event.results
  console.log('D')
  list.push('D')
  this.sendTaskSuccess({results: list})
}
