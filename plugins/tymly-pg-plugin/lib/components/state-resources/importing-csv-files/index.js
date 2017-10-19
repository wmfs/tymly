/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'

const supercopy = require('supercopy')
const multicopy = require('./multicopy.js')

class ImportingCsvFiles {
  init (resourceConfig, env, callback) {
    this.headerColumnNamePkPrefix = resourceConfig.headerColumnNamePkPrefix
    this.topDownTableOrder = resourceConfig.topDownTableOrder
    this.client = env.bootedServices.storage.client
    this.truncateTables = resourceConfig.truncateTables || false
    this.multicopyVar = resourceConfig.multicopy || false
    callback(null)
  }

  run (event, context) {
    if (this.multicopyVar === true) {
      multicopy.refresh(
        event,
        this.client
        ,
        function (err) {
          if (err) {
            context.sendTaskFailure(
              {
                error: 'multicopyFail',
                cause: err
              }
            )
          } else {
            context.sendTaskSuccess()
          }
        }
      )
    } else {
      return supercopy(
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
}

module.exports = ImportingCsvFiles
