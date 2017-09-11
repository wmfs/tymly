'use strict'

module.exports = class C {
  run (event, context) {
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
}
