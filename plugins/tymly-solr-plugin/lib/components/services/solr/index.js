'use strict'

const debug = require('debug')('tymly-solr-plugin')
const _ = require('lodash')
const process = require('process')
const boom = require('boom')
const request = require('request')
const defaultSolrSchemaFields = require('./solr-schema-fields.json')

class SolrService {
  boot (options, callback) {
    this.solrUrl = process.env.SOLR_URL === undefined ? 'http://localhost:8983/solr' : process.env.SOLR_URL
    debug('SOLR_URL: ', process.env.SOLR_URL)

    if (!options.blueprintComponents.hasOwnProperty('searchDocs')) {
      options.messages.info('WARNING: no search-docs configuration found')
      this.solrSchemaFields = []
      this.createViewSQL = null
      callback(null)
    } else {
      options.messages.info(`Using Solr... (${this.solrUrl})`)

      this.client = options.bootedServices.storage.client
      if (!this.client) {
        callback(boom.notFound('failed to boot solr service: no database client available'))
      } else {
        if (options.config.solrSchemaFields === undefined) {
          this.solrSchemaFields = SolrService.constructSolrSchemaFieldsArray(defaultSolrSchemaFields)
        } else {
          this.solrSchemaFields = SolrService.constructSolrSchemaFieldsArray(options.config.solrSchemaFields)
        }

        this.createViewSQL = this.buildCreateViewStatement(
          SolrService.constructModelsArray(options.blueprintComponents.models),
          SolrService.constructSearchDocsArray(options.blueprintComponents.searchDocs))
        if (this.createViewSQL) {
          this.client.query(this.createViewSQL, [], () => {
            debug('Database view created with SQL: ', this.createViewSQL)
            callback(null)
          })
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

  static constructSolrSchemaFieldsArray (fields) {
    const solrSchemaFieldsArray = []
    for (const field of fields) {
      solrSchemaFieldsArray.push([field, ''])
    }
    return solrSchemaFieldsArray
  }

  buildSelectStatement (model, searchDoc) {
    const columns = this.solrSchemaFields.map(
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
      this.buildDataImportPost('delta-import', core),
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
  bootBefore: ['tymlys']
}
