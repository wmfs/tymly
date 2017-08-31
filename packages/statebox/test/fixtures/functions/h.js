'use strict'

module.exports = function h (event, context) {
  const list = event.results
  list.push('H')
  this.sendTaskSuccess({results: list})
}
