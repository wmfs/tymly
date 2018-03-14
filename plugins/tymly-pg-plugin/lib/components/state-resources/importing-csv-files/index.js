/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'

const supercopy = require('supercopy')
const multicopy = require('./multicopy')

class ImportingCsvFiles {
  init (resourceConfig, env, callback) {
    this.headerColumnNamePkPrefix = resourceConfig.headerColumnNamePkPrefix
    this.topDownTableOrder = resourceConfig.topDownTableOrder
    this.client = env.bootedServices.storage.client
    this.truncateTables = resourceConfig.truncateTables || false
    this.multicopy = resourceConfig.multicopy || false
    callback(null)
  }

  run (event, context) {
    const operation = this.multicopy
      ? this.doMulticopy(event)
      : this.doCopy(event, context)

    operation
      .then(() => context.sendTaskSuccess())
      .catch(err => context.sendTaskFailure({
        error: this.multicopy ? 'multicopyFail' : 'supercopyFail',
        cause: err
      }))
  } // run

  doMulticopy (event) {
    return multicopy(
      event,
      this.client
    )
  } // doMulticopy

  doCopy (event, context) {
    return supercopy({
      sourceDir: event,
      headerColumnPkPrefix: this.headerColumnNamePkPrefix,
      topDownTableOrder: this.topDownTableOrder,
      client: this.client,
      schemaName: context.stateMachineMeta.schemaName,
      truncateTables: this.truncateTables,
      debug: true
    })
  } // doCopy
} // class ImportingCsvFiles

module.exports = ImportingCsvFiles
