'use strict'

module.exports = class A {
  run (event, context) {
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
}
