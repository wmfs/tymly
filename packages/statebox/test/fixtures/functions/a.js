'use strict'

module.exports = function a (event, context) {
  const _this = this
  const list = event.results
  setTimeout(
    function () {
      console.log('A')
      list.push('A')
      _this.sendTaskSuccess({results: list})
    },
    500
  )
}
