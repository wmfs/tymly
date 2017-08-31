'use strict'

module.exports = function f (event, context) {
  const list = event.results
  list.push('F')
  this.sendTaskSuccess({results: list})

}
