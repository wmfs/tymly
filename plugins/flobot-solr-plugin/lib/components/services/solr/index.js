'use strict'

const _ = require('lodash')
// const debug = require('debug')('flobot-solr-plugin')
const process = require('process')
const boom = require('boom')
const request = require('request')
const defaultSolrIndexFields = require('./solr-index-fields.json')

class SolrService {
  boot (options, callback) {
    this.solrUrl = process.env.SOLR_URL === undefined ? 'http://localhost:8983/solr' : process.env.SOLR_URL
    options.messages.info(`Using Solr... (${this.solrUrl})`)

    if (!options.blueprintComponents.hasOwnProperty('searchDocs')) {
      options.messages.info('WARNING: no search-doc configuration found')
      this.solrIndexFields = []
      this.createViewSQL = null
      callback(null)
    } else {
      this.client = options.bootedServices.storage.client
      if (!this.client) {
        callback(boom.notFound('failed to boot solr service: no database client available'))
      } else {
        if (options.config.solrIndexFields === undefined) {
          this.solrIndexFields = SolrService.constructSolrIndexFieldsArray(defaultSolrIndexFields)
        } else {
          this.solrIndexFields = SolrService.constructSolrIndexFieldsArray(options.config.solrIndexFields)
        }

        this.createViewSQL = this.buildCreateViewStatement(
          SolrService.constructModelsArray(options.blueprintComponents.models),
          SolrService.constructSearchDocsArray(options.blueprintComponents.searchDocs))
        if (this.createViewSQL) {
          this.client.query(this.createViewSQL, [], callback)
        }
      }
    }
  }

  static constructModelsArray (models) {
    let modelsArray = []
    for (const modelName in models) {
      if (models.hasOwnProperty(modelName)) {
        modelsArray.push(models[modelName])
      }
    }
    return modelsArray
  }

  static constructSearchDocsArray (searchDocs) {
    let searchDocsArray = []
    for (const searchDocName in searchDocs) {
      if (searchDocs.hasOwnProperty(searchDocName)) {
        searchDocsArray.push(searchDocs[searchDocName])
      }
    }
    return searchDocsArray
  }

  static constructSolrIndexFieldsArray (fields) {
    const solrIndexFieldsArray = []
    for (const field of fields) {
      solrIndexFieldsArray.push([field, ''])
    }
    return solrIndexFieldsArray
  }

  buildSelectStatement (model, searchDoc) {
    const columns = this.solrIndexFields.map(
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
      if (currentSearchDoc !== null) {
        selects.push(this.buildSelectStatement(model, currentSearchDoc))
      }
    }

    if (selects.length !== 0) {
      return `CREATE OR REPLACE VIEW fbot.solr_data AS \n${selects.join('\nUNION\n')};`
    } else {
      return null
    }
  }

  buildDataImportPost (command, core) {
    const uniqueIdentifier = new Date().getTime()
    return {
      url: `${this.solrUrl}/${core}/dataimport?_=${uniqueIdentifier}&indent=off&wt=json`,
      form: {
        'clean': true,
        'command': command,
        'commit': true,
        'core': core,
        'name': 'dataimport',
        'optimize': false,
        'verbose': false
      }
    }
  }

  executeSolrFullReindex (core, cb) {
    request.post(
      this.buildDataImportPost('full-import', core),
      function (err, response, body) {
        if (err) {
          cb(err)
        } else {
          cb(null, JSON.parse(body))
        }
      }
    )
  }

  executeSolrDeltaReindex (core, cb) {
    request.post(
      SolrService.buildDataImportPost('delta-import', core),
      function (err, response, body) {
        if (err) {
          cb(err)
        } else {
          cb(null, JSON.parse(body))
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
