/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'
const supercopy = require('supercopy')
const _ = require('lodash')
const debug = require('debug')('importingCsvFiles')
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
    debug(`Flobot ${flobot.flobotId} has entered state 'importingCsvFiles - enabling debug for 'supercopy' is a good idea too!`)
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
    debug(`Flobot ${flobot.flobotId} is leaving state 'importingCsvFiles`)
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: ImportingCsvFiles,
  schema: schema
}
