'use strict'

module.exports = function c (event, context) {
  const list = event.results
  setTimeout(
    function () {
      console.log('C')
      list.push('C')
      context.sendTaskSuccess({results: list})
    },
    250
  )
}
