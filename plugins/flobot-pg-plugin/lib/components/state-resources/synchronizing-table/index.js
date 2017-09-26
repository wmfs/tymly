/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'
const startTelepods = require('pg-telepods')
const schema = require('./schema.json')
const getFunction = require('flobot/lib/getFunction.js')

class SynchronizingTable {
  init (stateConfig, options, callback) {
    console.log('Init Synchronizing table')
    this.client = options.services.storage.client
    this.source = stateConfig.options.source
    this.target = stateConfig.options.target
    this.join = stateConfig.options.join
    this.transformFunction = getFunction(options, stateConfig.options.transformerFunctionName)
    callback(null)
  }

  enter (flobot, data, callback) {
    console.log('Enter Synchronizing table')
    startTelepods(
      {
        client: this.client,
        outputDir: flobot.ctx.outputDir,
        source: this.source,
        target: this.target,
        join: this.join,
        transformFunction: this.transformFunction
      },
      function (err, stats) {
        if (err) {
          console.log('error')
          callback(err)
        } else {
          console.log('Leaving Synchronizing table')
          callback(null)
        }
      }
    )
  }

  leave (flobot, data, callback) {
    console.log('Leave Synchronizing table')
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: SynchronizingTable,
  schema: schema
}
