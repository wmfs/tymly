'use strict'

class SolrService {
  boot (options, callback) {
    console.log('Solr Service says Hello World!')
    console.log(options)
    callback(null)
  }

  generateSelect (model, attribute) {
    return 'hello world!'
  }
}

module.exports = {
  serviceClass: SolrService,
  bootBefore: ['flobots']
}
