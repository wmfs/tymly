'use strict'

module.exports = function a (event, context) {
  console.log('A')
  this.sendTaskSuccess()
}
