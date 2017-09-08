'use strict'

module.exports = function add (event, context) {
  this.sendTaskSuccess(event.number1 + event.number2)
}
