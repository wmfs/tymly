'use strict'

module.exports = function subtract (event, context) {
  context.sendTaskSuccess(event.number1 - event.number2)
}
