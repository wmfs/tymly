'use strict'

const _ = require('lodash')
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
    this.client = options.client
    const table = components.table
    this.namespace = components.namespace
    this.modelId = components.modelId
    this.fullModelId = this.namespace + '_' + this.modelId
    this.schemaName = components.schemaName
    this.tableName = components.tableName
    this.fullTableName = this.schemaName + '.' + this.tableName
    this.fkConstraints = table.fkConstraints

    this.columnNames = Object.keys(table.columns)
    this.columnToPropertyId = this.columnNames.reduce((cols, col) => {
      cols[col] = _.camelCase(col)
      return cols
    }, {})
    this.propertyIdToColumn = Object.entries(this.columnToPropertyId).map(([col, prop]) => [prop, col]).reduce((props, [p, c]) => {
      props[p] = c
      return props
    }, {})
    this.columnToPropertyType = this.columnNames.reduce((cols, col) => {
      cols[col] = table.columns[col].dataType
      return cols
    }, {})

    this.columnNamesWithPropertyAliases = Object.entries(this.columnToPropertyId).map(([col, prop]) => `${col} AS "${prop}"`)
    this.propertyIds = Object.entries(this.columnToPropertyId).filter(([col]) => col[0] !== '_').map(([col, prop]) => prop)
    this.pkColumnNames = table.pkColumnNames
    this.pkPropertyIds = this.pkColumnNames.map(column => this.columnToPropertyId[column])
    this.attributeIds = _.difference(this.propertyIds, this.pkPropertyIds)

    this.subDocIds = [] // Populated once all state-machines are available
    this.fkColumnNames = Object.values(table.fkConstraints).reduce((cols, constraint) => cols.concat(constraint.sourceColumns), [])
    this.fkPropertyIds = this.fkColumnNames.map(fkColumnName => _.camelCase(fkColumnName))
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

  columnify (propertyIds) {
    if (Array.isArray(propertyIds)) {
      return propertyIds.map(id => this.propertyIdToColumn[id])
    }
    return this.propertyIdToColumn[propertyIds]
  }

  create (jsonData, options = {}, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.create, jsonData, options)
    } // if ...

    options.upsert = false
    const script = this.creator.makeStatements(jsonData, options)
    this.client.run(script, callback)
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

    if (!options.hasOwnProperty('destroyMissingSubDocs')) options.destroyMissingSubDocs = false
    if (!options.hasOwnProperty('setMissingPropertiesToNull')) options.setMissingPropertiesToNull = true
    const script = this.updater.makeStatements(doc, options)
    this.client.run(script, callback)
  }

  patch (doc, options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.patch, doc, options)
    } // if ...

    options.destroyMissingSubDocsv = false
    options.setMissingPropertiesToNull = false

    const script = this.updater.makeStatements(doc, options)
    this.client.run(script, callback)
  }

  upsert (jsonData, options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.upsert, jsonData, options)
    }
    options.upsert = true
    const script = this.creator.makeStatements(jsonData, options)
    this.client.run(script, callback)
  }

  destroyById (id, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.destroyById, id)
    }

    if (!_.isArray(id)) {
      id = [id]
    }
    const script = this.destroyer.makeStatements(id)
    this.client.run(script, callback)
  }

  parseDoc (doc, options) {
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

    const parsed = {
      keyAndAttributeProperties: {},
      attributeProperties: {},
      keyProperties: {},
      readOnlyProperties: {},
      unknownProperties: {},
      subDocs: {}
    }

    _.forOwn(doc, (value, id) => {
      if (this.attributeIds.indexOf(id) !== -1) {
        if (this.columnToPropertyType[this.columnToPropertyId[id]] === 'jsonb') {
          if (_.isArray(value)) value = JSON.stringify(value)
        }
        parsed.attributeProperties[id] = value
        parsed.keyAndAttributeProperties[id] = value
      } else {
        if (this.pkPropertyIds.indexOf(id) !== -1) {
          parsed.keyProperties[id] = value
          parsed.keyAndAttributeProperties[id] = value
        } else {
          if (id[0] === '_') {
            parsed.readOnlyProperties[id] = value
          } else {
            if (this.subDocIds.indexOf(id) !== -1) {
              parsed.subDocs[id] = value
            } else {
              parsed.unknownProperties[id] = value
            }
          }
        }
      }
    })

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

    parsed.keyColumns = this.columnify(_.keys(parsed.keyProperties))
    parsed.keyValues = _.values(parsed.keyProperties)

    parsed.attributeColumns = this.columnify(_.keys(parsed.attributeProperties))
    parsed.attributeValues = _.values(parsed.attributeProperties)

    parsed.keyAndAttributeColumns = this.columnify(_.keys(parsed.keyAndAttributeProperties))
    parsed.keyAndAttributeValues = _.values(parsed.keyAndAttributeProperties)

    parsed.missingAttributeIds = _.difference(this.attributeIdsWithoutfkPropertyIds, _.keys(parsed.attributeProperties))
    parsed.missingAttributeColumnNames = this.columnify(parsed.missingAttributeIds)

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
