'use strict'
const process = require('process')
const schema = require('./schema.json')

class EnvCommand {

  constructor (envConfig) {
    this.envVariableName = envConfig.variableName
    if (envConfig.hasOwnProperty('failIfNotSet')) {
      this.failIfNotSet = envConfig.failIfNotSet
    } else {
      this.failIfNotSet = false
    }
  }

  run (flobot, callback) {
    const value = process.env[this.envVariableName]
    if (value) {
      callback(null, value)
    } else {
      if (this.failIfNotSet) {
        callback({
          name: 'environmentVariableNotSet',
          message: 'Expected $' + this.envVariableName + ' to be set'
        })
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
