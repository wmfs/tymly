/**
 * Created by Aron.Moore on 12/07/2017.
 */
'use strict'
const supercopy = require('supercopy')
const _ = require('lodash')
const debug = require('debug')('importingCsvFiles')
const schema = require('./schema.json')

class ImportingCsvFiles {
  init (resourceConfig, env, callback) {
    this.headerColumnNamePkPrefix = resourceConfig.headerColumnNamePkPrefix
    this.topDownTableOrder = resourceConfig.topDownTableOrder
    this.client = env.bootedServices.storage.client
    this.truncateTables = resourceConfig.truncateTables || false
    callback(null)
  }

  run (event, context) {
    console.log('---->\n', context)
    debug(`Flobot ${flobot.flobotId} has entered state 'importingCsvFiles - enabling debug for 'supercopy' is a good idea too!`)
    supercopy(
      {
        sourceDir: event.sourceDir,
        headerColumnPkPrefix: this.headerColumnPkPrefix,
        topDownTableOrder: this.topDownTableOrder,
        client: this.client,
        schemaName: _.snakeCase(this.stateMachineNS), // this need to change
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
