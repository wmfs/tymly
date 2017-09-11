'use strict'

module.exports = class G {
  run (event, context) {
    const list = event.results
    console.log('G')
    list.push('G')
    context.sendTaskSuccess({results: list})
  }
}
