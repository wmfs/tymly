'use strict'
// const smithereens = require('smithereens')
const debug = require('debug')('processingCsvFiles')

class ProcessingXmlFiles {
  init (resourceConfig, env, callback) {
    console.log('-->resourceConfig',resourceConfig)
    this.rootXMLElement = resourceConfig.rootXMLElement
    this.headerMap = resourceConfig.headerMap
    callback(null)
  }

  run (event, context) {
    console.log('-->event', event)
    console.log('woooo')
    context.sendTaskSuccess()
  }
}

module.exports = ProcessingXmlFiles
