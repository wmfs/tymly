'use strict'

const schema = require('./schema.json')
const debug = require('debug')('processingXmlFiles')

class ProcessingXmlFiles {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    debug(`Flobot ${flobot.flobotId} is entering state 'processingXmlFiles`)
    callback(null)
  }

  leave (flobot, data, callback) {
    debug(`Flobot ${flobot.flobotId} is leaving state 'processingXmlFiles'`)
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: ProcessingXmlFiles,
  schema: schema
}
