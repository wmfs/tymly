'use strict'

const _ = require('lodash')

class SolrService {
  boot (options, callback) {
    console.log('Solr Service says Hello World!')
    console.log(options)
    callback(null)
  }

  generateSelect (ns, model, attribute) {
    let sql = `SELECT 1,2,3 FROM ${_.snakeCase(ns)}.${_.snakeCase(model.title)}`
    return sql
  }
}

module.exports = {
  serviceClass: SolrService,
  bootBefore: ['flobots']
}
