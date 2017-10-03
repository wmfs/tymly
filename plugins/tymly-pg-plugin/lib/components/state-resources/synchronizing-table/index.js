/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'
const startTelepods = require('pg-telepods')
const getFunction = require('tymly/lib/getFunction.js')

class SynchronizingTable {
  init (resourceConfig, env, callback) {
    console.log('Init Synchronizing table')
    this.client = env.bootedServices.storage.client
    this.source = resourceConfig.source
    this.target = resourceConfig.target
    this.join = resourceConfig.join
    this.transformFunction = getFunction(
      env,
      resourceConfig.transformerFunctionName
    )
    callback(null)
  }

  run (event, context) {
    console.log('Enter Synchronizing table')
    startTelepods(
      {
        client: this.client,
        outputDir: event,
        source: this.source,
        target: this.target,
        join: this.join,
        transformFunction: this.transformFunction
      },
      function (err) {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'startTelepodsFail',
              cause: err
            }
          )
        } else {
          context.sendTaskSuccess()
        }
      }
    )
  }
}

module.exports = SynchronizingTable
