'use strict'

const _ = require('lodash')

class SolrService {
  boot (options, callback) {
    console.log('Solr Service says Hello World!')
    console.log(options)
    callback(null)
  }

  generateSelect (ns, model, attribute) {
    let columns = []
    for (const [solrFieldName, modelColumnName] of Object.entries(attribute.attributeMapping)) {
      if (modelColumnName[0] === '@') {
        columns.push(`${modelColumnName.substring(1)} AS ${solrFieldName}`)
      } else {
        columns.push(`${modelColumnName} AS ${solrFieldName}`)
      }
    }
    let sql = `SELECT ${columns.join(', ')} FROM ${_.snakeCase(ns)}.${_.snakeCase(model.title)}`
    console.log(sql)
    return sql
  }
}

module.exports = {
  serviceClass: SolrService,
  bootBefore: ['flobots']
}
