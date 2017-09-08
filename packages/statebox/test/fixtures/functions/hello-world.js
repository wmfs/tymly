'use strict'

module.exports = function helloWorld (event, context) {
  console.log('HELLO WORLD!')
  this.sendTaskSuccess()
}
