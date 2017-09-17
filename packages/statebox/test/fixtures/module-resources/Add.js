'use strict'

module.exports = class Add {
  run (event, context) {
    context.sendTaskSuccess(event.number1 + event.number2)
  }
}
