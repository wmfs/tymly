'use strict'

module.exports = class World {
  run (event, context) {
    console.log('...WORLD!')
    context.sendTaskSuccess()
  }
}
