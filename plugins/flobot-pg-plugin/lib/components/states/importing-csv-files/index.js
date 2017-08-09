/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'
const supercopy = require('supercopy')
const _ = require('lodash')
const schema = require('./schema.json')

class ImportingCsvFiles {
  init (stateConfig, options, callback) {
    this.headerColumnNamePkPrefix = stateConfig.options.headerColumnNamePkPrefix
    this.topDownTableOrder = stateConfig.options.topDownTableOrder
    this.client = options.services.storage.client
    this.flowNamespace = stateConfig._meta.flowNamespace
    callback(null)
  }

  enter (flobot, data, callback) {
    supercopy(
      {
        sourceDir: flobot.ctx.sourceDir,
        headerColumnPkPrefix: this.headerColumnPkPrefix,
        topDownTableOrder: this.topDownTableOrder,
        client: this.client,
        schemaName: _.snakeCase(this.flowNamespace),
        debug: true
      },
      function (err) {
        if (err) {
          callback(err)
        } else {
          callback(null)
        }
      }
    )
  }

  leave (flobot, data, callback) {
    // const ctx = flobot.ctx
    console.log('Importing CSV file')
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: ImportingCsvFiles,
  schema: schema
}
