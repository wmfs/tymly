'use strict'

module.exports = function a (event, context) {
  console.log('B')
  this.sendTaskSuccess()
}
