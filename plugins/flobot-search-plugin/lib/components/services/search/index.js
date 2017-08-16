'use strict'

const schema = require('./schema.json')

class SearchService {
  boot (options, callback) {
    console.log('INIT SOLR')
    // let client = options.bootedServices.storage.client
    callback(null)
  }
}

module.exports = {
  serviceClass: SearchService,
  bootAfter: ['storage'],
  schema: schema
}
