'use strict'

module.exports = function d (event, context) {
  const list = event.results
  list.push('D')
  this.sendTaskSuccess({results: list})

}
