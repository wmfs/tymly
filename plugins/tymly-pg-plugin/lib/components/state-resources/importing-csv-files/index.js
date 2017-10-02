/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'

const supercopy = require('supercopy')

class ImportingCsvFiles {
  init (resourceConfig, env, callback) {
    this.headerColumnNamePkPrefix = resourceConfig.headerColumnNamePkPrefix
    this.topDownTableOrder = resourceConfig.topDownTableOrder
    this.client = env.bootedServices.storage.client
    this.truncateTables = resourceConfig.truncateTables || false
    callback(null)
  }

  run (event, context) {
    supercopy(
      {
        sourceDir: event,
        headerColumnPkPrefix: this.headerColumnPkPrefix,
        topDownTableOrder: this.topDownTableOrder,
        client: this.client,
        schemaName: context.stateMachineMeta.schemaName,
        truncateTables: this.truncateTables,
        debug: true
      },
      function (err) {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'supercopyFail',
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

module.exports = ImportingCsvFiles
