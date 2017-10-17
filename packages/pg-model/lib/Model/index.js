'use strict'

const _ = require('lodash')
const scriptRunner = require('./utils/script-runner')
const Finder = require('./actions/Finder')
const Creator = require('./actions/Creator')
const Destroyer = require('./actions/Destroyer')
const Updater = require('./actions/Updater')

const NotSet = 'NetSet'

function promised (obj, fn, ...args) {
  return new Promise((resolve, reject) => {
    fn.call(obj, ...args, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
} // promised

class Model {
  constructor (components, options) {
    const _this = this
    this.client = options.client
    const table = components.table
    this.namespace = components.namespace
    this.modelId = components.modelId
    this.fullModelId = this.namespace + '_' + this.modelId
    this.schemaName = components.schemaName
    this.tableName = components.tableName
    this.fullTableName = this.schemaName + '.' + this.tableName
    this.fkConstraints = table.fkConstraints

    this.columnNames = _.keys(table.columns)
    this.columnNamesWithPropertyAliases = _.map(this.columnNames, function (columnName) { return columnName + ' AS "' + _.camelCase(columnName) + '"' })

    this.propertyIds = _.compact(_.map(this.columnNames, function (columnName) { if (columnName[0] !== '_') { return _.camelCase(columnName) } }))
    this.pkColumnNames = table.pkColumnNames
    this.pkPropertyIds = _.map(this.pkColumnNames, function (columnName) { return _.camelCase(columnName) })
    this.attributeIds = _.difference(this.propertyIds, this.pkPropertyIds)

    this.subDocIds = [] // Populated once all state-machines are available
    this.fkColumnNames = []
    this.fkPropertyIds = []
    _.forOwn(
      table.fkConstraints,
      function (fkConstraint) {
        _this.fkColumnNames = _this.fkColumnNames.concat(fkConstraint.sourceColumns)
      }
    )
    this.fkColumnNames.forEach(
      function (fkColumnName) {
        _this.fkPropertyIds.push(_.camelCase(fkColumnName))
      }
    )
    this.attributeIdsWithoutfkPropertyIds = _.difference(this.attributeIds, this.fkPropertyIds)

    this.subModels = {}// Added once all state-machines are available
    this.deleteMissingSql = 'DELETE FROM ' + this.fullTableName + ' WHERE '
    if (this.pkColumnNames.length === 1) {
      this.deleteMissingSql += this.pkColumnNames[0] + ' != ANY($1)'
    } else {
      // TODO: Support composite-keyed sub docs
    }

    this.deleteMissingSql = 'DELETE FROM ' + this.fullTableName + ' WHERE '
    this.deleteMissingSql += this.pkColumnNames[0] + ' != ANY($1)'

    this.finder = new Finder(this)
    this.creator = new Creator(this)
    this.destroyer = new Destroyer(this)
    this.updater = new Updater(this)

    this.promised = (...args) => promised(this, ...args)
  }

  create (jsonData, options = { }, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.create, jsonData, options)
    } // if ...

    options.upsert = false
    const script = [{statement: 'BEGIN'}]
    this.creator.addStatements(script, jsonData, options)
    scriptRunner(this, script, callback)
  }

  findById (id, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.findById, id)
    }

    if (!_.isArray(id)) {
      id = [id]
    }
    const doc = {}
    this.finder.find(
      doc,
      {
        where: this.makeWhereFromId(id)
      },
      function (err) {
        if (err) {
          callback(err)
        } else {
          callback(null, Finder.removeTopLevelDocAndFlatten(doc))
        }
      }
    )
  }

  find (options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.find, options)
    } // if ...

    const doc = {}
    this.finder.find(
      doc,
      options,
      function (err) {
        if (err) {
          callback(err)
        } else {
          callback(null, Finder.removeTopLevelDoc(doc))
        }
      }
    )
  }

  findOne (options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.findOne, options)
    } // if ...

    options.limit = 1
    const doc = {}
    this.finder.find(
      doc,
      options,
      function (err) {
        if (err) {
          callback(err)
        } else {
          callback(null, Finder.removeTopLevelDocAndFlatten(doc))
        }
      }
    )
  }

  extractIdFromJsonData (jsonData) {
    const id = []
    this.pkPropertyIds.forEach(
      function (propertyId) {
        id.push(jsonData[propertyId])
      }
    )
    return id
  }

  update (doc, options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.update, doc, options)
    } // if ...

    options.destroyMissingSubDocs = false
    options.setMissingPropertiesToNull = true
    const script = [{statement: 'BEGIN'}]
    this.updater.addStatements(
      script,
      doc,
      options
    )
    scriptRunner(this, script, callback)
  }

  patch (doc, options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.patch, doc, options)
    } // if ...

    const script = [{statement: 'BEGIN'}]

    options.destroyMissingSubDocsv = false
    options.setMissingPropertiesToNull = false

    this.updater.addStatements(
      script,
      doc,
      options
    )
    scriptRunner(this, script, callback)
  }

  upsert (jsonData, options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.upsert, jsonData, options)
    }
    options.upsert = true
    const script = [{statement: 'BEGIN'}]
    this.creator.addStatements(
      script,
      jsonData,
      options
    )
    scriptRunner(this, script, callback)
  }

  destroyById (id, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.destroyById, id)
    }

    if (!_.isArray(id)) {
      id = [id]
    }
    const script = [{statement: 'BEGIN'}]
    this.destroyer.addStatements(script, id)
    scriptRunner(this, script, callback)
  }

  parseDoc (doc, options) {
    const _this = this

    // Parse options
    let includeNullFks
    if (options) {
      if (options.hasOwnProperty('includeNullFks')) {
        includeNullFks = options.includeNullFks
      } else {
        includeNullFks = false
      }
    } else {
      includeNullFks = false
    }

    function columnify (propertyIds) {
      return _.map(propertyIds, function (propertyId) { return _.kebabCase(propertyId).replace(/-/g, '_') })
    }

    const parsed = {
      keyAndAttributeProperties: {},
      attributeProperties: {},
      keyProperties: {},
      readOnlyProperties: {},
      unknownProperties: {},
      subDocs: {}
    }

    _.forOwn(
      doc,
      function (value, id) {
        if (_this.attributeIds.indexOf(id) !== -1) {
          parsed.attributeProperties[id] = value
          parsed.keyAndAttributeProperties[id] = value
        } else {
          if (_this.pkPropertyIds.indexOf(id) !== -1) {
            parsed.keyProperties[id] = value
            parsed.keyAndAttributeProperties[id] = value
          } else {
            if (id[0] === '_') {
              parsed.readOnlyProperties[id] = value
            } else {
              if (_this.subDocIds.indexOf(id) !== -1) {
                parsed.subDocs[id] = value
              } else {
                parsed.unknownProperties[id] = value
              }
            }
          }
        }
      }
    )

    if (includeNullFks) {
      this.fkPropertyIds.forEach(
        function (propertyId) {
          if (!parsed.attributeProperties.hasOwnProperty(propertyId)) {
            parsed.attributeProperties[propertyId] = null
            parsed.keyAndAttributeProperties[propertyId] = null
          }
        }
      )
    }

    parsed.keyColumns = columnify(_.keys(parsed.keyProperties))
    parsed.keyValues = _.values(parsed.keyProperties)

    parsed.attributeColumns = columnify(_.keys(parsed.attributeProperties))
    parsed.attributeValues = _.values(parsed.attributeProperties)

    parsed.keyAndAttributeColumns = columnify(_.keys(parsed.keyAndAttributeProperties))
    parsed.keyAndAttributeValues = _.values(parsed.keyAndAttributeProperties)

    parsed.missingAttributeIds = _.difference(_this.attributeIdsWithoutfkPropertyIds, _.keys(parsed.attributeProperties))
    parsed.missingAttributeColumnNames = _.map(parsed.missingAttributeIds, function (propertyId) { return _.kebabCase(propertyId).replace(/-/g, '_') })

    parsed.primaryKeyValues = {}
    this.pkPropertyIds.forEach(
      function (propertyId) {
        parsed.primaryKeyValues[propertyId] = doc[propertyId]
      }
    )

    return parsed
  }

  makeWhereFromId (id) {
    let i = -1
    const where = {}
    this.pkPropertyIds.forEach(
      function (propertyId) {
        i++
        where[propertyId] = {'equals': id[i]}
      }
    )
    return where
  }

  extractPkValuesFromDoc (doc) {
    const pkValues = []
    this.pkPropertyIds.forEach(
      function (propertyId) {
        pkValues.push(doc[propertyId])
      }
    )
    return pkValues
  }

  debug () {
    console.log('')
    console.log('------------------- ' + this.fullModelId + '-------------------')
    console.log('  primaryKey: ' + JSON.stringify(this.pkPropertyIds))
    console.log('  propertyIds')
    this.propertyIds.forEach(
      function (propertyId) {
        console.log('    + ' + propertyId)
      }
    )

    console.log('  Table')
    console.log('    fullTableName: ' + this.fullTableName)
    console.log('    primaryKey: ' + JSON.stringify(this.pkColumnNames))

    if (this.subDocIds.length > 0) {
      console.log('  SubDocs')
      _.forOwn(
        this.subDocs,
        function (subDoc, subDocPropertyId) {
          subDoc.debug()
        }
      )
    }
  }
}

module.exports = Model
