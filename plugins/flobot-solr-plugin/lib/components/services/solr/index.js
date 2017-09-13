'use strict'

const _ = require('lodash')
const debug = require('debug')('flobot-solr-plugin')

class SolrService {
  boot (options, callback) {
    this.client = options.bootedServices.storage.client

    // const attributes = this.constructSearchAttributeArray(options.blueprintComponents.searchDocs)
    // const models = this.constructModelArray(options.blueprintComponents.models)
    // const fields = this.constructFieldArray(options.config.solrIndexFields)

    // TODO: Best way to do this Jez?

    // const viewStr = this.buildCreateViewStatement('x', models, attributes, fields)
    callback(null)
  }

  constructModelArray (models) {
    let modelArray = []
    for (const model in models) {
      if (models.hasOwnProperty(model)) {
        modelArray.push(models[model])
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

  buildCreateViewStatement (ns, models, searchDocs, solrFieldDefault) {
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
        selects.push(this.buildSelectStatement(ns, model, currentSearchDoc, solrFieldDefault))
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
