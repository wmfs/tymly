'use strict'

// const debug = require('debug')('tymly')
const uuid = require('uuid')
const _ = require('lodash')

require('underscore-query')(_)

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

// TODO: This could be a useful module in its own right?

class MemoryModel {
  constructor (modelDefinition) {
    this.name = modelDefinition.name
    this.namespace = modelDefinition.namespace

    this.modelId = modelDefinition.id
    this.data = []
    this.primaryKeyProvided = _.isArray(modelDefinition.primaryKey)
    this.properties = modelDefinition.properties

    if (this.primaryKeyProvided) {
      this.primaryKey = modelDefinition.primaryKey
    } else {
      this.primaryKey = ['id']
    }

    this.promised = (...args) => promised(this, ...args)
  }

  extractIdPropertiesFromDoc (doc) {
    const properties = {}
    this.primaryKey.forEach(
      function (propertyId) {
        properties[propertyId] = doc[propertyId]
      }
    )

    return properties
  }

  create (jsonData, options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.create, jsonData, options)
    }

    const _this = this
    let idProperties
    let err = null

    function createOne (doc) {
      const whereProperties = _this.extractIdPropertiesFromDoc(doc)
      const index = _this.findFirstIndex(whereProperties)

      if (index === -1) {
        const copy = _.cloneDeep(doc)
        if (!_this.primaryKeyProvided) {
          copy.id = uuid()
        }
//        copy.created = now
//        copy.updated = now
        _this.data.push(copy)

        if (!idProperties) {
          idProperties = _this.extractIdPropertiesFromDoc(copy)
        }
      } else {
        if (!err) {
          err = {
            name: 'DuplicatePrimaryKey',
            message: `Unable to create model '${_this.modelId}' because ${JSON.stringify(whereProperties)} already exists`
          }
        }
      }
    }

    if (_.isArray(jsonData)) {
      jsonData.forEach(
        function (doc) {
          createOne(doc)
        }
      )
    } else {
      createOne(jsonData)
    }

    if (err) {
      callback(err)
    } else {
      callback(
        null,
        {
          idProperties: idProperties
        }
      )
    }
  }

  applyModifiers (docs, options) {
    if (options.hasOwnProperty('orderBy')) {
      docs = _.sortBy(docs, options.orderBy)
    }

    if (options.hasOwnProperty('offset')) {
      docs = docs.slice(options.offset)
    }

    if (options.hasOwnProperty('limit')) {
      docs = docs.slice(0, options.limit)
    }

    return docs
  }

  applyWhere (options) {
    const _this = this
    if (options.hasOwnProperty('where')) {
      const filtered = []

      this.data.forEach(
        function (row) {
          let matches = true

          _.forOwn(
            options.where,
            function (condition, propertyId) {
              const conditionType = _.keys(condition)[0]
              const expression = _.values(condition)[0]

              if (conditionType === 'equals') {
                if (row[propertyId] !== expression) {
                  matches = false
                }
              }
            }
          )

          if (matches) {
            filtered.push(row)
          }
        }
      )
      return _this.applyModifiers(filtered, options)
    } else {
      return _this.applyModifiers(this.data, options)
    }
  }

  // TODO: Options! limit/offset etc.
  find (options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.find, options)
    }
    const output = this.applyWhere(options)
    callback(null, output)
  }

  turnIdIntoWhere (id) {
    const where = {}
    let i = -1
    this.primaryKey.forEach(
      function (propertyId) {
        i++
        where[propertyId] = {equals: id[i]}
      }
    )
    return where
  }

  turnIdIntoProperties (id) {
    const properties = {}
    let i = -1
    this.primaryKey.forEach(
      function (propertyId) {
        i++
        properties[propertyId] = id[i]
      }
    )
    return properties
  }

  findById (id, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.findById, id)
    }
    if (!_.isArray(id)) {
      id = [id]
    }

    this.findOne(
      {
        where: this.turnIdIntoWhere(id)
      },
      callback
    )
  }

  findOne (options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.findOne, options)
    }

    let doc
    const output = this.applyWhere(options)
    if (output.length > 0) {
      doc = _.cloneDeep(output[0])
    }
    callback(null, doc)
  }

  findFirstIndex (whereProperties) {
    let index = -1

    let i = -1
    this.data.forEach(
      function (row) {
        i++

        if (index === -1) {
          let matches = true

          _.forOwn(
            whereProperties,
            function (value, propertyId) {
              if (value !== row[propertyId]) {
                matches = false
              }
            }
          )

          if (matches) {
            index = i
          }
        }
      }
    )

    return index
  }

  update (doc, options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.update, doc, options)
    }

    if (options.setMissingPropertiesToNull === false) {
      return this.patch(doc, options, callback)
    }

    const where = this.extractIdPropertiesFromDoc(doc)
    const index = this.findFirstIndex(where)
    if (index !== -1) {
      this.data[index] = _.cloneDeep(doc)
    }
    callback(null)
  }

  patch (doc, options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.patch, doc, options)
    }

    const where = this.extractIdPropertiesFromDoc(doc)
    const index = this.findFirstIndex(where)
    if (index !== -1) {
      for (const [k, v] of Object.entries(doc)) { this.data[index][k] = v }
    }
    callback(null)
  }

  upsert (doc, options, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.upsert, doc, options)
    }

    const whereProperties = this.extractIdPropertiesFromDoc(doc)
    const index = this.findFirstIndex(whereProperties)

    if (index !== -1) {
      if (options.setMissingPropertiesToNull === false) {
        return this.patch(doc, options, callback)
      }

      this.data[index] = _.cloneDeep(doc)
      callback(null)
    } else {
      this.create(
        doc,
        options,
        callback
      )
    }
  }

  destroyById (id, callback = NotSet) {
    if (callback === NotSet) {
      return this.promised(this.destroyById, id)
    }

    if (!_.isArray(id)) {
      id = [id]
    }
    const properties = this.turnIdIntoProperties(id)
    const index = this.findFirstIndex(properties)
    if (index !== -1) {
      this.data.splice(index, 1)
      callback(null, 0)
    }
  }
}

module.exports = MemoryModel
