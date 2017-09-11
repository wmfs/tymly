'use strict'

module.exports = class Hello {
  run (event, context) {
    console.log('HELLO...')
    context.sendTaskSuccess()
  }
}
