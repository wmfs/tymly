'use strict'

module.exports = function add (event, context) {
  context.sendTaskSuccess(event.number1 + event.number2)
}
