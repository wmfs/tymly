'use strict'

const vsprintf = require('sprintf-js').vsprintf
const dottie = require('dottie')
const schema = require('./schema.json')

class SprintfCommand {
  constructor (commandConfig) {
    this.template = commandConfig.template
    this.inputPaths = commandConfig.inputPaths
  }

  run (tymly, callback) {
    const ctx = tymly.ctx
    const inputs = []
    this.inputPaths.forEach(
      function (path) {
        inputs.push(dottie.get(ctx, path))
      }
    )

    const output = vsprintf(this.template, inputs)
    callback(null, output)
  }
}

module.exports = {
  schema: schema,
  commandFunction: SprintfCommand
}
