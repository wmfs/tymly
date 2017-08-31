'use strict'

module.exports = function a (event, context) {
  const list = event.results
  list.push('A')
  this.sendTaskSuccess({results: list})

}
