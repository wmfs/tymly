'use strict'

module.exports = function subtract (event, context) {
  console.log('SUBTRACTING...')
  this.sendTaskSuccess()
}
