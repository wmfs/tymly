'use strict'

const debug = require('debug')('tymly-pg-plugin')

const _ = require('lodash')
const schema = require('./schema.json')
const process = require('process')
const async = require('async')

const relationize = require('relationize')
const pgInfo = require('pg-info')
const pgDiffSync = require('pg-diff-sync')
const pgModel = require('pg-model')

const HlPgClient = require('hl-pg-client')

const generateUpsertStatement = require('./generate-upsert-statement')

class PostgresqlStorageService {
  boot (options, callback) {
    this.storageName = 'postgresql'

    const connectionString = PostgresqlStorageService._connectionString(options.config)
    infoMessage(options.messages, `Using PostgresqlStorage... (${connectionString})`)

    this.client = new HlPgClient(connectionString)

    const modelDefinitions = options.blueprintComponents.models || {}
    const seedData = options.blueprintComponents.seedData

    this.models = {}
    this.schemaNames = []
    this.jsonSchemas = []

    this._pushModelSchemas(modelDefinitions)

    this._installExtension()
      .then(() => this._createModels(options.messages))
      .then(() => this._insertMultipleSeedData(seedData, options.messages))
      .then(() => callback())
      .catch(err => callback(err))
  } // boot

  async shutdown () {
    await this.client.pool_.end()
  }

  static _connectionString (config) {
    if (config.pgConnectionString) {
      debug('Using config.pgConnectionString')
      return config.pgConnectionString
    }

    debug('Using PG_CONNECTION_STRING environment variable')
    return process.env.PG_CONNECTION_STRING
  } // _connectionUrl

  _pushModelSchemas (modelDefinitions) {
    Object.values(modelDefinitions).forEach(
      modelDefinition => this._pushModelSchema(modelDefinition)
    )
  } // _pushModelSchemas

  _pushModelSchema (modelDefinition) {
    const schemaName = _.kebabCase(modelDefinition.namespace).replace(/-/g, '_')
    if (!this.schemaNames.includes(schemaName)) {
      this.schemaNames.push(schemaName)
    }

    this.jsonSchemas.push({
      namespace: modelDefinition.namespace,
      schema: modelDefinition
    })
  } // _pushModelSchema

  async _installExtension () {
    return this.client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
  }

  async _createModels (messages) {
    if (!this.schemaNames.length || !this.jsonSchemas.length) {
      infoMessage(messages, 'No models to create')
      return
    }
    infoMessage(messages, `Getting info for from DB schemas: ${this.schemaNames.join(', ')}...`)
    const currentDbStructure = await pgInfo({
      client: this.client,
      schemas: this.schemaNames
    })

    const expectedDbStructure = await relationize({
      source: {
        schemas: this.jsonSchemas
      }
    })

    const rawStatements = pgDiffSync(
      currentDbStructure,
      expectedDbStructure
    )
    const statements = rawStatements.map(s => {
      // console.log(s)
      return {
        'sql': s,
        'params': []
      }
    })
    await this.client.run(statements)

    const models = pgModel({
      client: this.client,
      dbStructure: expectedDbStructure
    })

    infoMessage(messages, 'Models:')
    for (const [namespaceId, namespace] of Object.entries(models)) {
      for (const [modelId, model] of Object.entries(namespace)) {
        const id = `${namespaceId}_${modelId}`
        if (!this.models[id]) {
          detailMessage(messages, id)
          this.models[id] = model
        } // if ...
      } // for ...
    } // for ...
  } // _boot

  async addModel (name, definition, messages) {
    if (!name || !definition) {
      return
    }

    if (this.models[name]) {
      detailMessage(messages, `${name} already defined in PostgresqlStorage ...`)
      return this.models[name]
    }

    detailMessage(messages, `Adding ${name} to PostgresqlStorage`)
    this._pushModelSchema(definition)
    await this._createModels(messages)
    return this.models[name]
  } // addModel

  _insertMultipleSeedData (seedDataArray, messages) {
    return new Promise((resolve, reject) => {
      this._doInsertMultipleSeedData(seedDataArray, messages, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  } // insertMultipleSeedData

  _doInsertMultipleSeedData (seedDataArray, messages, callback) {
    const _this = this
    if (seedDataArray) {
      callback(null)
      infoMessage(messages, 'Loading seed data:')
      async.eachSeries(
        seedDataArray,
        (seedData, cb) => {
          const name = seedData.namespace + '_' + seedData.name
          const model = _this.models[name]
          if (model) {
            detailMessage(messages, name)

            // generate upsert sql statement
            const sql = generateUpsertStatement(model, seedData)
            debug('load', name, 'seed-data sql: ', sql)

            // generate a single array of parameters which each
            // correspond with a placeholder in the upsert sql statement
            let params = []
            _.forEach(seedData.data, (row) => {
              params = params.concat(row)
            })
            debug('load', name, 'seed-data params: ', params)

            _this.client.run(
              [{
                'sql': sql,
                'params': params
              }],
              function (err) {
                if (err) {
                  cb(err)
                } else {
                  cb(null)
                }
              }
            )
          } else {
            detailMessage(messages, `WARNING: seed data found for model ${name}, but no such model was found`)
            cb(null)
          }
        },
        (err) => {
          if (err) {
            callback(err)
          } else {
            callback(null)
          }
        })
    } else {
      infoMessage(messages, 'No seed data to insert')
      callback(null)
    }
  } // insertMultipleSeedData
} // PostgresqlStorageService

function detailMessage (messages, msg) {
  if (!messages) {
    return
  }

  messages.detail(msg)
} // detailMessage

function infoMessage (messages, msg) {
  if (!messages) {
    return
  }

  messages.info(msg)
} // infoMessage

module.exports = {
  schema: schema,
  serviceClass: PostgresqlStorageService,
  refProperties: {
    modelId: 'models'
  }
}
