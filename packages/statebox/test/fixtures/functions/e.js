'use strict'

module.exports = function e (event, context) {
  const list = event.results
  list.push('E')
  this.sendTaskSuccess({results: list})

}
