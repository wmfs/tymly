'use strict'

module.exports = class F {
  run (event, context) {
    const list = event.results
    console.log('F')
    list.push('F')
    context.sendTaskSuccess({results: list})
  }
}
