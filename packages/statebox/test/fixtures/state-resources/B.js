'use strict'

module.exports = class B {
  run (event, context) {
    const list = event.results
    console.log('B')
    list.push('B')
    context.sendTaskSuccess({results: list})
  }
}
