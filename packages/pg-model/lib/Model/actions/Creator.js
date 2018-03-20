'use strict'

const _ = require('lodash')
const generateValuePlaceholders = require('./../utils/generate-value-placeholders')
const getPreStatementHookFunction = require('./get-pre-statement-hook-function')

class Creator {
  constructor (model) {
    this.model = model
    this.fullTableName = model.fullTableName
    this.prefix = 'INSERT INTO ' + this.fullTableName + ' AS a'
    this.primaryKeyColumns = model.pkColumnNames
  }

  makeStatements (jsonData, options, preStatementHook) {
    const script = []
    const _this = this

    function createPostStatementHook (result, ctx) {
      if (!ctx.hasOwnProperty('returnValue')) {
        const returnValue = {}
        _.forOwn(
          result.rows[0],
          function (value, columnName) {
            returnValue[_.camelCase(columnName)] = value
          }
        )
        ctx.returnValue = {
          idProperties: returnValue
        }
      }
      if (!ctx.hasOwnProperty('lastCreatedPrimaryKey')) {
        ctx.lastCreatedPrimaryKey = {}
      }
      ctx.lastCreatedPrimaryKey[this.fullTableName] = result.rows[0]
    }

    function addInsertStatementToScript (doc) {
      const parsedDoc = _this.model.parseDoc(doc, {includeNullFks: true})
      let statement = `${_this.prefix} (${parsedDoc.keyAndAttributeColumns.join(',')}) VALUES (${generateValuePlaceholders(parsedDoc.keyAndAttributeColumns.length)})`

      if (options.hasOwnProperty('upsert') && options.upsert) {
        const updateColumns = []
        const updatePlaceholders = []
        const whereParts = []
        let i = -1

        parsedDoc.keyAndAttributeColumns.forEach(
          function (columnName) {
            i++
            if (_this.primaryKeyColumns.indexOf(columnName) === -1) {
              updateColumns.push(columnName)
              updatePlaceholders.push('$' + (i + 1))
            } else {
              whereParts.push('a.' + columnName + '=$' + (parsedDoc.keyAndAttributeColumns.indexOf(columnName) + 1))
            }
          }
        )
        let setMissingPropertiesToNull
        if (options.hasOwnProperty('setMissingPropertiesToNull')) {
          setMissingPropertiesToNull = options.setMissingPropertiesToNull
        } else {
          setMissingPropertiesToNull = true
        }
        if (setMissingPropertiesToNull) {
          parsedDoc.missingAttributeColumnNames.forEach(
            function (column) {
              updateColumns.push(column)
              updatePlaceholders.push('null')
            }
          )
        }
        let conflictClause
        if (updateColumns.length > 0 && whereParts.length > 0) {
          conflictClause = ` ON CONFLICT (${_this.primaryKeyColumns.join(', ')}) DO UPDATE SET (${updateColumns.join(',')})=(${updatePlaceholders.join(',')}) WHERE ${whereParts.join(',')}`
        } else {
          conflictClause = ' ON CONFLICT DO NOTHING'
        }
        statement += conflictClause
      }

      statement += ` RETURNING ${_this.primaryKeyColumns.join(', ')};`

      const scriptEntry = {
        sql: statement,
        params: parsedDoc.keyAndAttributeValues,
        columnNames: parsedDoc.keyAndAttributeColumns,
        postStatementHook: createPostStatementHook.bind(_this)
      }

      if (preStatementHook) {
        scriptEntry.preStatementHook = preStatementHook.bind(_this)
      }

      script.push(scriptEntry)

      _.forOwn(
        parsedDoc.subDocs,
        function (subDoc, propertyId) {
          const subModel = _this.model.subModels[propertyId]

          const subScript = subModel.model.creator.makeStatements(
            doc[propertyId],
            options,
            getPreStatementHookFunction(_this.fullTableName, subModel.columnJoin)
          )
          script.push(...subScript)
        }
      )
    }

    if (_.isArray(jsonData)) {
      jsonData.forEach(
        addInsertStatementToScript
      )
    } else {
      addInsertStatementToScript(jsonData)
    }
    return script
  } // addStatements
}

module.exports = Creator
