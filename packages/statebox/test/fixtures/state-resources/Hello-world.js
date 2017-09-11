'use strict'

module.exports = class HelloWorld {
  run (event, context) {
    console.log('HELLO WORLD!')
    context.sendTaskSuccess()
  }
}
