/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'
const generateDelta = require('pg-delta-file')

class exportingCsvDeltaFile {
  init (stateConfig, options, callback) {
    console.log('Init Exporting CSV file')
    this.client = options.services.storage.client
    this.since = stateConfig.options.since
    this.createdColumnName = stateConfig.options.createdColumnName
    this.modifiedColumnName = stateConfig.options.modifiedColumnName
    this.tables = stateConfig.options.tables
    callback(null)
  }

  enter (flobot, data, callback) {
    console.log('Enter Exporting CSV file')
    generateDelta(
      {
        client: this.client,
        since: this.since,
        outputFilepath: flobot.ctx.outputFilepath,
        actionAliases: this.actionAliases,
        createdColumnName: this.createdColumnName,
        modifiedColumnName: this.modifiedColumnName,
        tables: this.tables
      },
      function (err) {
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
    console.log('Exporting CSV file')
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: exportingCsvDeltaFile
}
