'use strict'

module.exports = function hello (event, context) {
  console.log('...WORLD!')
  this.sendTaskSuccess()
}
