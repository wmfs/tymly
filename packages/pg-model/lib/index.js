const _ = require('lodash')
const dottie = require('dottie')
const Model = require('./Model')
const View = require('./View')

function debugDump (models) {
  for (const namespace of Object.values(models)) {
    for (const model of Object.values(namespace)) {
      model.debug()
    }
  }
} // debugDump

function createModel (schemaName, schema, tableName, table, options) {
  return new Model(
    {
      namespace: _.camelCase(schemaName),
      modelId:_.camelCase(tableName),
      schemaName: schemaName,
      schema: schema,
      tableName: tableName,
      table: table
    },
    options
  )
} // createModel

function createView (schemaName, schema, viewName, view, options) {
  return new View(
    {
      namespace: _.camelCase(schemaName),
      modelId:_.camelCase(viewName),
      schemaName: schemaName,
      schema: schema,
      viewName: viewName,
      view: view
    },
    options
  )
} // createView

function createModels (options) {
  const schemas = options.dbStructure.schemas

  const models = {}

  for (const [schemaName, schema] of Object.entries(schemas)) {
    for (const [tableName, table] of Object.entries(schema.tables)) {
      const model = createModel(schemaName, schema, tableName, table, options)

      const path = `${model.namespace}.${model.modelId}`
      dottie.set(models, path, model)
    } // for ...

    for (const [viewName, view] of Object.entries(schema.views)) {
      const model = createView(schemaName, schema, viewName, view, options)

      const path = `${model.namespace}.${model.modelId}`
      dottie.set(models, path, model)
    } // for ...
  } // for ...

  hookupSubModels(models)

  return models
} // createModels

function hookupSubModels(models) {
  // hook up sub-models
  for (const namespace of Object.values(models)) {
    for (const [modelId, model] of Object.entries(namespace)) {
      for (const fkConstraint of Object.values(model.fkConstraints || {})) {
        const [parentSchemaName, parentTableName] = fkConstraint.targetTable.split('.')
        const parentNamespaceId = _.camelCase(parentSchemaName)
        const parentPropertyId = _.camelCase(parentTableName)
        const parentModel = models[parentNamespaceId][parentPropertyId]
        const parentColumns = fkConstraint.sourceColumns
        const childColumns = fkConstraint.targetColumns

        const columnJoin = {}
        for (const i in parentColumns) {
          columnJoin[parentColumns[i]] = childColumns[i]
        }

        parentModel.subModels[modelId] = {
          model: model,
          columnJoin: columnJoin,
          sourceProperties: fkConstraint.sourceColumns.map(_.camelCase),
          targetProperties: fkConstraint.targetColumns.map(_.camelCase)
        }

        parentModel.subDocIds.push(modelId)
      }
    }
  }
} // hookupSubModels

module.exports = function pgModel (options) {
  const models = createModels(options)

  if (options.debug) {
    debugDump(models)
  }

  return models
}
