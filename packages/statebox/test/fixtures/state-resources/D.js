'use strict'

module.exports = class D {
  run (event, context) {
    const list = event.results
    console.log('D')
    list.push('D')
    context.sendTaskSuccess({results: list})
  }
}
