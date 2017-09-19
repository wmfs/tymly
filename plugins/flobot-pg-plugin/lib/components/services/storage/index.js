'use strict'

const _ = require('lodash')
const schema = require('./schema.json')
const process = require('process')

const pg = require('pg')
const relationize = require('relationize')
const pgInfo = require('pg-info')
const pgDiffSync = require('pg-diff-sync')
const pgModel = require('pg-model')

const pgScriptRunner = require('./pg-script-runner')

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
                const statements = pgDiffSync(
                    currentDbStructure,
                    expectedDbStructure
                )

                pgScriptRunner(
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
                      callback(null)
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
