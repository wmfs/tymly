'use strict'

const _ = require('lodash')
const debug = require('debug')('flobot-solr-plugin')

class SolrService {
  boot (options, callback) {
    this.client = options.bootedServices.storage.client
    callback(null)
  }

  buildSelectStatement (ns, model, attribute, solrFieldDefaults) {
    const columns = solrFieldDefaults.map(
      solrDefault => {
        const solrFieldName = solrDefault[0]
        const defaultValue = solrDefault[1]
        let mappedValue = attribute.attributeMapping[solrFieldName]
        if (!_.isUndefined(mappedValue)) {
          if (mappedValue[0] === '@') {
            mappedValue = _.snakeCase(mappedValue.substring(1))
          }
        }
        return `${mappedValue || defaultValue} AS ${_.snakeCase(solrFieldName)}`
      }
    )

    return `SELECT ${columns.join(', ')} FROM ${_.snakeCase(ns)}.${_.snakeCase(model.title)}`
  }

  buildCreateViewStatement (ns, models, attributes, solrFieldDefault) {
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
        selects.push(this.buildSelectStatement(ns, model, currentAttribute, solrFieldDefault))
      } else {
        debug('Can not find attribute config for model ' + model.title)
      }
    }

    return `CREATE OR REPLACE VIEW ${ns}.solr_data AS \n${selects.join('\nUNION\n')};`
  }

  executeSQL (sql, cb) {
    this.client.query(sql, [], cb)
  }
}

module.exports = {
  serviceClass: SolrService,
  bootAfter: ['storage'],
  bootBefore: ['flobots']
}
