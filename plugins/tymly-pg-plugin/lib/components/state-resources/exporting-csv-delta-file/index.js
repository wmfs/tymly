/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'
const generateDelta = require('pg-delta-file')

class ExportingCsvDeltaFile {
  init (resourceConfig, env, callback) {
    this.client = env.bootedServices.storage.client
    this.since = resourceConfig.since
    this.actionAliases = resourceConfig.actionAliases
    this.createdColumnName = resourceConfig.createdColumnName || '_created'
    this.modifiedColumnName = resourceConfig.modifiedColumnName || '_modified'
    this.csvExtracts = resourceConfig.csvExtracts
    callback(null)
  }

  run (event, context) {
    generateDelta(
      {
        namespace: context.stateMachineMeta.namespace,
        client: this.client,
        since: this.since,
        outputFilepath: event,
        actionAliases: this.actionAliases,
        createdColumnName: this.createdColumnName,
        modifiedColumnName: this.modifiedColumnName,
        csvExtracts: this.csvExtracts
      },
      function (err) {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'generateDeltaFail',
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

module.exports = ExportingCsvDeltaFile
