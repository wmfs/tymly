'use strict'

module.exports = class E {
  run (event, context) {
    const list = event.results
    console.log('E')
    list.push('E')
    context.sendTaskSuccess({results: list})
  }
}
