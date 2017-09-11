'use strict'

module.exports = function a (event, context) {
  const list = event.results
  setTimeout(
    function () {
      console.log('A')
      list.push('A')
      context.sendTaskSuccess({results: list})
    },
    500
  )
}
