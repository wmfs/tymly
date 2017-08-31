'use strict'

module.exports = function c (event, context) {
  const list = event.results
  list.push('C')
  this.sendTaskSuccess({results: list})
}
