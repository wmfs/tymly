'use strict'

const debug = require('debug')('tymly-pg-plugin')

const _ = require('lodash')
const schema = require('./schema.json')
const process = require('process')
const async = require('async')

const pg = require('pg')
const relationize = require('relationize')
const pgInfo = require('pg-info')
const pgDiffSync = require('pg-diff-sync')
const pgModel = require('pg-model')

const pgStatementRunner = require('./pg-statement-runner')
const generateUpsertStatement = require('./generate-upsert-statement')

class PostgresqlStorageService {
  boot (options, callback) {
    const _this = this
    this.storageName = 'postgresql'

    const modelDefinitions = options.blueprintComponents.models || {}
    this.models = {}

    const connectionString = process.env.PG_CONNECTION_STRING
    options.messages.info(`Using Postgresql storage... (${connectionString})`)

    // TODO: Use pool instead

    this.client = new pg.Client(connectionString)
    this.client.connect()

    const schemaNames = _.uniq(_.map(modelDefinitions, function (modelDefinition) {
      return _.kebabCase(modelDefinition.namespace).replace(/-/g, '_')
    }))

    options.messages.info(`Getting info for from DB schemas: ${schemaNames.join(', ')}...`)
    pgInfo(
      {
        client: this.client,
        schemas: schemaNames
      },
      function (err, currentDbStructure) {
        if (err) {
          callback(err)
        } else {
          const jsonSchemas = []

          _.forOwn(
            modelDefinitions,
            function (modelDefinition, modelId) {
              jsonSchemas.push(
                {
                  namespace: modelDefinition.namespace,
                  schema: modelDefinition
                }
              )
            }
          )

          relationize(
            {
              source: {
                schemas: jsonSchemas
              }
            },
            function (err, expectedDbStructure) {
              if (err) {
                callback(err)
              } else {
                let statements = pgDiffSync(
                  currentDbStructure,
                  expectedDbStructure
                )

                for (let i = 0, statementLength = statements.length; i < statementLength; i++) {
                  let s = statements[i]
                  statements[i] = {
                    'sql': s,
                    'params': []
                  }
                }

                pgStatementRunner(
                  _this.client,
                  statements,
                  function (err) {
                    if (err) {
                      callback(err)
                    } else {
                      const models = pgModel(
                        {
                          client: _this.client,
                          dbStructure: expectedDbStructure
                        }
                      )

                      _this.models = {}
                      options.messages.info('Models:')

                      _.forOwn(
                        models,
                        function (namespace, namespaceId) {
                          _.forOwn(
                            namespace,
                            function (model, modelId) {
                              const id = namespaceId + '_' + modelId
                              options.messages.detail(id)
                              _this.models[id] = model
                            }
                          )
                        }
                      )

                      if (options.blueprintComponents.seedData) {
                        options.messages.info('Loading seed data:')
                        async.eachSeries(
                          options.blueprintComponents.seedData,
                          (seedData, cb) => {
                            const name = seedData.namespace + '_' + seedData.name
                            const model = _this.models[name]
                            if (model) {
                              options.messages.detail(name)

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

                              pgStatementRunner(
                                _this.client,
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
                              options.messages.detail(`WARNING: seed data found for model ${name}, but no such model was found`)
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
                        callback(null)
                      }
                    }
                  }
                )
              }
            }
          )
        }
      }
    )
  }
}

module.exports = {
  schema: schema,
  serviceClass: PostgresqlStorageService,
  refProperties: {
    modelId: 'models'
  }
}
