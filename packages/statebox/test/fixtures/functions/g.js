'use strict'

module.exports = function a (event, context) {
  console.log('G')
  this.sendTaskSuccess()
}
