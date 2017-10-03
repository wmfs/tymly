'use strict'
const process = require('process')
const schema = require('./schema.json')
const boom = require('boom')

class EnvCommand {
  constructor (envConfig) {
    this.envVariableName = envConfig.variableName
    if (envConfig.hasOwnProperty('failIfNotSet')) {
      this.failIfNotSet = envConfig.failIfNotSet
    } else {
      this.failIfNotSet = false
    }
  }

  run (tymly, callback) {
    const value = process.env[this.envVariableName]
    if (value) {
      callback(null, value)
    } else {
      if (this.failIfNotSet) {
        callback(boom.notFound('Expected $' + this.envVariableName + ' to be set', {envVariableName: this.envVariableName}))
      } else {
        callback(null)
      }
    }
  }
}

module.exports = {
  schema: schema,
  commandFunction: EnvCommand
}
