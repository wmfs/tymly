'use strict'

const uuid = require('uuid/v1')
const nanoid = require('nanoid/generate')
const ALPHABET = 'abcdefghijklmnopqrstvwxyzABCDEFGHIJKLMNOPQRSTVWXYZ1234567890'

module.exports = class GenerateUuid {
  init (resourceConfig, env, callback) {
    this.length = resourceConfig.length || 10
    this.short = resourceConfig.short || false
    callback(null)
  }

  run (event, context) {
    const id = this.short ? nanoid(ALPHABET, this.length) : uuid()
    context.sendTaskSuccess({id})
  }
}
