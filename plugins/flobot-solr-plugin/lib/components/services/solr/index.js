'use strict'

const _ = require('lodash')

class SolrService {
  boot (options, callback) {
    this.client = options.bootedServices.storage.client
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
    // console.log(sql)
    return sql
  }

  buildViewSql (ns, models, attributes, solrFieldDefault) {
    let selects = []
    for (let model of models) {
      let currentAttribute = null
      for (let attribute of attributes) {
        if (attribute.modelId === model.title) {
          currentAttribute = attribute
          break
        }
      }
      if (currentAttribute != null) {
        selects.push(this.generateSelect(ns, model, currentAttribute, solrFieldDefault))
      } else {
        console.log('Can not find attribute config for model ' + model.title)
      }
    }
    let sqlString = `CREATE OR REPLACE VIEW ${ns}.solr_data AS \n${selects.join('\nUNION\n')};`
    return sqlString
  }

  createView (sql, cb) {
    client.query(sql, [], cb)
  }
}

module.exports = {
  serviceClass: SolrService,
  bootAfter: ['storage'],
  bootBefore: ['flobots']
}
