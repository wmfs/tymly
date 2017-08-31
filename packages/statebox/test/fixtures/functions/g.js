'use strict'

module.exports = function g (event, context) {
  const list = event.results
  list.push('G')
  this.sendTaskSuccess({results: list})

}
