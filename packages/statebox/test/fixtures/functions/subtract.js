'use strict'

module.exports = function subtract (event, context) {
  this.sendTaskSuccess(event.number1 - event.number2)
}
