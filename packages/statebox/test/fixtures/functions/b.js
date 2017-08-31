'use strict'

module.exports = function b (event, context) {
  const list = event.results
  list.push('B')
  this.sendTaskSuccess({results: list})

}
