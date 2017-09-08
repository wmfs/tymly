'use strict'

const _ = require('lodash')

class SolrService {
  boot (options, callback) {
    console.log('Solr Service says Hello World!')
    console.log(options)
    callback(null)
  }

  generateSelect (ns, model, attribute, solrFieldDefaults) {
    const columns = solrFieldDefaults.map(
      solrDefault => {
        const solrFieldName = solrDefault[0]
        const defaultValue = solrDefault[1]
        let mappedValue = attribute.attributeMapping[solrFieldName]
        if (!_.isUndefined(mappedValue)) {
          if (mappedValue[0] === '@') {
            mappedValue = mappedValue.substring(1)
          }
        }
        const columnDefinition = `${mappedValue || defaultValue} AS ${solrFieldName}`
        return columnDefinition
      }
    )

    let sql = `SELECT ${columns.join(', ')} FROM ${_.snakeCase(ns)}.${_.snakeCase(model.title)}`
    console.log(sql)
    return sql
  }
}

module.exports = {
  serviceClass: SolrService,
  bootBefore: ['flobots']
}
