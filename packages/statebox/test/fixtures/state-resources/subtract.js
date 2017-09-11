'use strict'

module.exports = class Subtract {
  run (event, context) {
    context.sendTaskSuccess(event.number1 - event.number2)
  }
}
