'use strict'

module.exports = function f (event, context) {
  const list = event.results
  console.log('F')
  list.push('F')
  this.sendTaskSuccess({results: list})
}
