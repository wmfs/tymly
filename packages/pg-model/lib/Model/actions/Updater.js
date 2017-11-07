'use strict'

const _ = require('lodash')
const getPreStatementHookFunction = require('./get-pre-statement-hook-function')

function getPostHookFunction (fullTableName, pk) {
  return function (result, ctx) {
    if (!ctx.hasOwnProperty('lastCreatedPrimaryKey')) {
      ctx.lastCreatedPrimaryKey = {}
    }
    ctx.lastCreatedPrimaryKey[fullTableName] = pk
  }
}

class Updater {
  constructor (model) {
    this.model = model
    this.fullTableName = model.fullTableName
    this.prefix = 'UPDATE ' + this.fullTableName + ' SET '
  }

  makeStatements (jsonData, options) {
    const _this = this
    const script = []
    const values = []

    const parsedDoc = _this.model.parseDoc(jsonData)
    const set = []
    let i = 0
    parsedDoc.attributeColumns.forEach(
      function (column) {
        i++
        set.push(column + '=$' + i)
        values.push(parsedDoc.attributeValues[i - 1])
      }
    )

    if (options.setMissingPropertiesToNull) {
      parsedDoc.missingAttributeColumnNames.forEach(
        function (column) {
          set.push(column + '=null')
        }
      )
    }

    const key = []
    let j = 0
    parsedDoc.keyColumns.forEach(
      function (column) {
        j++
        i++
        key.push(column + '=$' + i)
        values.push(parsedDoc.keyValues[j - 1])
      }
    )

    let sql = _this.prefix + set.join(', ')
    sql += ' WHERE ' + key.join(' AND ')

    script.push(
      {
        sql: sql,
        params: values,
        postStatementHook: getPostHookFunction(this.fullTableName, parsedDoc.primaryKeyValues)
      }
    )

    _.forOwn(
      this.model.subModels,
      function (subModel, subModelId) {
        const subDocPkValues = []

        if (jsonData.hasOwnProperty(subModelId)) {
          jsonData[subModelId].forEach(
            function (row) {
              subDocPkValues.push(subModel.model.extractPkValuesFromDoc(row))

              // Add inferred FK columns
              _.forOwn(
                subModel.columnJoin,
                function (parentColumnsName, childColumnsName) {
                  row[childColumnsName] = jsonData[parentColumnsName]
                }
              )

              options.upsert = true
              options.destroyMissingSubDocs = true
              const subScript = subModel.model.creator.makeStatements(
                row,
                options,
                getPreStatementHookFunction(_this.fullTableName, subModel.columnJoin)
              )
              script.push(...subScript)
            }
          )

          if (options.hasOwnProperty('destroyMissingSubDocs') && options.destroyMissingSubDocs) {
            if (subDocPkValues[0].length === 1) {
              const firstPkValues = []
              subDocPkValues.forEach(
                function (pkValue) {
                  firstPkValues.push(pkValue[0])
                }
              )
              script.push(
                {
                  sql: subModel.model.deleteMissingSql,
                  params: [firstPkValues]
                }
              )
            } else {
              // TODO: Composite subdoc keys!
              throw new Error('Composite subdoc keys not supported!')
            }
          }
        }
      }
    )
    return script
  }
}

module.exports = Updater
