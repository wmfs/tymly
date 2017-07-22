/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'
const startTelepods = require('pg-telepods')

class synchronizingTable {
  init (stateConfig, options, callback) {
    console.log('Init Synchronizing table')
    this.client = options.services.storage.client
    this.source = stateConfig.options.source
    this.target = stateConfig.options.target
    this.join = stateConfig.options.join
    this.transformFunction = options.services.functions.functions[stateConfig.options.transformerFunctionName].func
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
          console.log('done')
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
  stateClass: synchronizingTable
}
