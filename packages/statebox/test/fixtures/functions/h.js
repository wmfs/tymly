'use strict'

module.exports = function a (event, context) {
  const list = event.results
  list.push('H')

  console.log('??????', list)

  this.sendTaskSuccess({results: list})
}
