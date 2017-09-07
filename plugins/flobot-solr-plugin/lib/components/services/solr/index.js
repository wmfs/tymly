'use strict'

class SolrService {
  boot (options, callback) {
    callback(null)
  }
}

module.exports = {
  serviceClass: SolrService,
  bootBefore: ['flobots']
}
