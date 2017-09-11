'use strict'

module.exports = function world (event, context) {
  console.log('...WORLD!')
  context.sendTaskSuccess()
}
