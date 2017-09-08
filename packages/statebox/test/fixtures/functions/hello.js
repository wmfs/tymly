'use strict'

module.exports = function hello (event, context) {
  console.log('HELLO...')
  this.sendTaskSuccess()
}
