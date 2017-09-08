'use strict'

module.exports = function c (event, context) {
  const _this = this
  const list = event.results
  setTimeout(
    function () {
      console.log('C')
      list.push('C')
      _this.sendTaskSuccess({results: list})
    },
    250
  )
}
