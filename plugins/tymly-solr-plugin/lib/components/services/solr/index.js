'use strict'

const debug = require('debug')('tymly-solr-plugin')
const _ = require('lodash')
const process = require('process')
const boom = require('boom')
const request = require('request')
const defaultSolrSchemaFields = require('./solr-schema-fields.json')

class SolrService {
  boot (options, callback) {
    this.solrUrl = SolrService._connectionString(options.config)

    if (!options.blueprintComponents.hasOwnProperty('searchDocs')) {
      options.messages.info('No search-docs configuration found')
      this.solrSchemaFields = []
      this.createViewSQL = null
      callback(null)
    } else {
      options.messages.info(`Using Solr... (${this.solrUrl})`)
      this.searchDocs = options.blueprintComponents.searchDocs
      this.client = options.bootedServices.storage.client
      if (!this.client) {
        callback(boom.notFound('failed to boot solr service: no database client available'))
      } else {
        if (options.config.solrSchemaFields === undefined) {
          this.solrSchemaFields = SolrService.constructSolrSchemaFieldsArray(defaultSolrSchemaFields)
        } else {
          this.solrSchemaFields = SolrService.constructSolrSchemaFieldsArray(options.config.solrSchemaFields)
        }
        debug('solrSchemaFields', this.solrSchemaFields)

        this.createViewSQL = this.buildCreateViewStatement(
          SolrService.constructModelsArray(options.blueprintComponents.models),
          SolrService.constructSearchDocsArray(this.searchDocs))
        if (this.createViewSQL) {
          this.client.query(this.createViewSQL, [], (err) => {
            debug('Database view created with SQL: ', this.createViewSQL)
            callback(err)
          })
        } else {
          callback(boom.notFound('failed to construct create view SQL'))
        }
      }
    }
  }

  static _connectionString (config) {
    if (config.solrUrl) {
      debug('Using config.solrUrl')
      return config.solrUrl
    }

    if (process.env.SOLR_URL) {
      debug('Using SOLR_URL environment variable')
      return process.env.SOLR_URL
    }

    debug('Using default Solr URL')
    return 'http://localhost:8983/solr'
  } // _connectionUrl

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
      solrSchemaFieldsArray.push([field, field])
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
      const modelId = `${_.camelCase(model.namespace)}_${model.id}`
      debug(` - model ${modelId}`)
      let currentSearchDoc = null
      for (let searchDoc of searchDocs) {
        const searchDocId = `${_.camelCase(searchDoc.namespace)}_${searchDoc.id}`
        debug('   - searchDoc', searchDocId)
        if (searchDocId === modelId) {
          currentSearchDoc = searchDoc
          debug(`     > Corresponding searchDoc '${searchDocId}' found for model '${modelId}'!`)
          break
        }
      }
      if (currentSearchDoc !== null) {
        selects.push(this.buildSelectStatement(model, currentSearchDoc))
      }
    }

    if (selects.length !== 0) {
      return `CREATE OR REPLACE VIEW tymly.solr_data AS \n${selects.join('\nUNION\n')};`
    } else {
      return null
    }
  }

  executeSolrFullReindex (core, cb) {
    this._executeReindex('full-import', core, cb)
  }

  executeSolrDeltaReindex (core, cb) {
    this._executeReindex('delta-import', core, cb)
  }

  _executeReindex (type, core, cb) {
    if (!process.env.SOLR_URL) {
      return cb(null)
    }

    request.post(
      buildDataImportPost(this.solrUrl, type, core),
        (err, response, body) => (err) ? cb(err) : cb(null, JSON.parse(body))
    )
  } // _executeReindex
}

function buildDataImportPost (solrUrl, command, core) {
  const uniqueIdentifier = new Date().getTime()
  return {
    url: `${solrUrl}/${core}/dataimport?_=${uniqueIdentifier}&indent=off&wt=json`,
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
} // buildDataImportPost

module.exports = {
  serviceClass: SolrService,
  bootAfter: ['storage']
}
