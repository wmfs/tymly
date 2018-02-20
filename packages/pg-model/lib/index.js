/* eslint-env mocha */

// https://www.npmjs.com/package/mem-fs-editor

'use strict'

const _ = require('lodash')
const dottie = require('dottie')
const Model = require('./Model')

module.exports = function pgModel (options) {
  const schemas = options.dbStructure.schemas

  const models = {}

  _.forOwn(
    schemas,
    function (schema, schemaName) {
      _.forOwn(
        schema.tables,
        function (table, tableName) {
          const namespace = _.camelCase(schemaName)
          const modelId = _.camelCase(tableName)
          const path = namespace + '.' + modelId

          const model = new Model(
            {
              namespace: namespace,
              modelId: modelId,
              schemaName: schemaName,
              schema: schema,
              tableName: tableName,
              table: table
            },
            options
          )

          dottie.set(
            models,
            path,
            model
          )
        }
      )
    }
  )

  // Add sub-state-machines
  _.forOwn(
    models,
    function (namespace, namespaceId) {
      _.forOwn(
        namespace,
        function (model, modelId) {
          _.forOwn(
            model.fkConstraints,
            function (fkConstraint, fkConstraintName) {
              const parts = fkConstraint.targetTable.split('.')
              const parentSchemaName = parts[0]
              const parentTableName = parts[1]
              const parentNamespaceId = _.camelCase(parentSchemaName)
              const parentPropertyId = _.camelCase(parentTableName)
              const parentModel = models[parentNamespaceId][parentPropertyId]
              const parentColumns = fkConstraint.sourceColumns
              const childColumns = fkConstraint.targetColumns

              const columnJoin = {}
              for (let i = 0; i < parentColumns.length; i++) {
                columnJoin[parentColumns[i]] = childColumns[i]
              }

              parentModel.subModels[modelId] = {
                model: model,
                columnJoin: columnJoin,
                sourceProperties: _.map(fkConstraint.sourceColumns, function (columnName) { return _.camelCase(columnName) }),
                targetProperties: _.map(fkConstraint.targetColumns, function (columnName) { return _.camelCase(columnName) })
              }

              parentModel.subDocIds.push(modelId)
            }
          )
        }
      )
    }
  )

  if (options.debug) {
    _.forOwn(
      models,
      function (namespace, namespaceId) {
        _.forOwn(
          namespace,
          function (model, modelId) {
            model.debug()
          }
        )
      }
    )
  }

  return models
}
