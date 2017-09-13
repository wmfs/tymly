'use strict'

const _ = require('lodash')
const debug = require('debug')('flobot-solr-plugin')
const process = require('process')
const boom = require('boom')
const request = require('request')
const defaultSolrIndexFields = require('./solr-index-fields.json')

class SolrService {
  boot (options, callback) {
    this.viewNamespace = 'fbot'
    this.solrUrl = process.env.SOLR_URL === undefined ? 'http://localhost:8983/solr' : process.env.SOLR_URL
    options.messages.info(`Using Solr... (${this.solrUrl})`)

    if (!options.blueprintComponents.hasOwnProperty('searchDocs')) {
      this.fields = []
      this.createViewSQL = null
      callback(null)
    } else {
      this.client = options.bootedServices.storage.client

      if (!this.client) {
        callback(boom.notFound('failed to boot solr service: no database client available'))
      } else {
        if (options.config.solrIndexFields === undefined) {
          this.fields = this.constructFieldArray(defaultSolrIndexFields)
        } else {
          this.fields = this.constructFieldArray(options.config.solrIndexFields)
        }
        this.createViewSQL = this.buildCreateViewStatement(
          this.constructModelArray(options.blueprintComponents.models),
          this.constructSearchAttributeArray(options.blueprintComponents.searchDocs))

        this.client.query(this.createViewSQL, [], callback)
      }
    }
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

  executeSolrFullReindex (core, cb) {
    const uniqueIdentifier = new Date().getTime()
    const url = `${this.solrUrl}/${core}/dataimport?_=${uniqueIdentifier}&indent=on&wt=json`

    request.post(
      {
        url: url,
        form: {
          'clean': true,
          'command': 'full-import',
          'commit': true,
          'core': core,
          'name': 'dataimport',
          'optimize': false,
          'verbose': false
        }
      },
      function (err, response, body) {
        if (err) {
          debug('solr dataimport command failed', err)
          cb(err)
        } else {
          debug(body)
          cb(null)
        }
      }
    )
  }

  executeSolrDeltaReindex (core, cb) {
    const uniqueIdentifier = new Date().getTime()
    const url = `${this.solrUrl}/${core}/dataimport?_=${uniqueIdentifier}&indent=on&wt=json`

    request.post(
      {
        url: url,
        form: {
          'clean': true,
          'command': 'delta-import',
          'commit': true,
          'core': core,
          'name': 'dataimport',
          'optimize': false,
          'verbose': false
        }
      },
      function (err, response, body) {
        if (err) {
          debug('solr dataimport command failed', err)
          cb(err)
        } else {
          debug(body)
          cb(null)
        }
      }
    )
  }
}

module.exports = {
  serviceClass: SolrService,
  bootAfter: ['storage'],
  bootBefore: ['flobots']
}
