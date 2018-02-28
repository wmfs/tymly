'use strict'

const schema = {
  type: 'object',
  properties: {
    message: {type: 'string'},
    somethingElse: {type: 'string'}
  },
  required: ['message']
}

module.exports = class Goodbye {
  init (resourceConfig, env, callback) {
    this.schema = schema
    callback(null)
  }

  run (event, context) {
    console.log('GOODBYE!')
    context.sendTaskSuccess()
  }
}
