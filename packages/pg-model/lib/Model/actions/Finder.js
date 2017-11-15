'use strict'

const _ = require('lodash')
const async = require('async')

const optionParser = require('./../utils/option-parser')

class Finder {
  constructor (model) {
    this.modelId = model.modelId
    this.propertyIdToColumn = model.propertyIdToColumn
    this.subModels = model.subModels
    this.fkConstraints = model.fkConstraints
    this.client = model.client
    this.sql = `SELECT ${model.columnNamesWithPropertyAliases} FROM ${model.fullTableName}`
  }

  static removeTopLevelDoc (doc) {
    const topLevelKeys = _.keys(doc)
    if (topLevelKeys.length === 1) {
      return doc[topLevelKeys[0]]
    }
  }

  static removeTopLevelDocAndFlatten (doc) {
    const topLevelDocs = Finder.removeTopLevelDoc(doc)
    if (_.isArray(topLevelDocs) && topLevelDocs.length === 1) {
      return topLevelDocs[0]
    }
  }

  find (targetRoot, options, callback) {
    const _this = this
    const parsedOptions = optionParser(this.sql, this.propertyIdToColumn, options)

    this.client.query(
      parsedOptions.sql,
      parsedOptions.values,
      function (err, result) {
        if (err) {
          callback(err)
        } else {
          targetRoot[_this.modelId] = result.rows

          async.eachOfSeries(
            _this.subModels,
            function (subModel, subModelId, cb) {
              async.everySeries(
                targetRoot[_this.modelId],
                function (row, cb2) {
                  const where = {}
                  let i = -1
                  subModel.sourceProperties.forEach(
                    function (sourcePropertyId) {
                      i++
                      const targetPropertyId = subModel.targetProperties[i]
                      where[sourcePropertyId] = {'equals': row[targetPropertyId]}
                    }
                  )

                  subModel.model.finder.find(
                    row,
                    {
                      where: where
                    },
                    function (err) {
                      if (err) {
                        cb2(err)
                      } else {
                        cb(null)
                      }
                    }
                  )
                },
                cb
              )
            },
            callback
          )
        }
      }
    )
  }
}

module.exports = Finder
