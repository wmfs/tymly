'use strict'

const _ = require('lodash')
const debug = require('debug')('flobot-solr-plugin')

class SolrService {
  boot (options, callback) {
    this.viewNamespace = 'fbot'
    if (!options.blueprintComponents.hasOwnProperty('searchDocs')) {
      this.fields = []
      this.createViewSQL = null
      callback(null)
    }

    this.client = options.bootedServices.storage.client
    this.fields = this.constructFieldArray(options.config.solrIndexFields)
    this.createViewSQL = this.buildCreateViewStatement(
      this.constructModelArray(options.blueprintComponents.models),
      this.constructSearchAttributeArray(options.blueprintComponents.searchDocs))

    callback(null)
  }

  constructModelArray (models) {
    let modelArray = []
    for (const modelName in models) {
      if (models.hasOwnProperty(modelName)) {
        modelArray.push(models[modelName])
      }
    }
    return modelArray
  }

  constructSearchAttributeArray (searchDocs) {
    let attributes = []
    for (const searchDocName in searchDocs) {
      if (searchDocs.hasOwnProperty(searchDocName)) {
        attributes.push(searchDocs[searchDocName])
      }
    }
    return attributes
  }

  constructFieldArray (solrIndexFields) {
    const fieldArray = []
    for (const field of solrIndexFields) {
      fieldArray.push([field, ''])
    }
    return fieldArray
  }

  buildSelectStatement (model, searchDoc) {
    const columns = this.fields.map(
      solrDefault => {
        const solrFieldName = solrDefault[0]
        const defaultValue = solrDefault[1]
        let mappedValue = searchDoc.attributeMapping[solrFieldName]
        if (!_.isUndefined(mappedValue)) {
          if (mappedValue[0] === '@') {
            mappedValue = _.snakeCase(mappedValue.substring(1))
          }
        }
        return `${mappedValue || defaultValue} AS ${_.snakeCase(solrFieldName)}`
      }
    )

    debug('>>>', model)
    return `SELECT ${columns.join(', ')} FROM ${_.snakeCase(model.namespace)}.${_.snakeCase(model.title)}`
  }

  buildCreateViewStatement (models, searchDocs) {
    let selects = []
    for (let model of models) {
      let currentSearchDoc = null
      for (let searchDoc of searchDocs) {
        if (searchDoc.modelId === model.id) {
          currentSearchDoc = searchDoc
          break
        }
      }
      if (currentSearchDoc != null) {
        selects.push(this.buildSelectStatement(model, currentSearchDoc))
      }
    }

    return `CREATE OR REPLACE VIEW ${this.viewNamespace}.solr_data AS \n${selects.join('\nUNION\n')};`
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
