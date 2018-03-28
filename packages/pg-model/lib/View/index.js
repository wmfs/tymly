const _ = require('lodash')

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

class View {
  constructor(components, options) {
    this.client = options.client
    const view = components.view
    this.namespace = components.namespace
    this.modelId = components.modelId
    this.fullModelId = this.namespace + '_' + this.modelId
    this.schemaName = components.schemaName
    this.viewName = components.viewName
    this.fullViewName = this.schemaName + '.' + this.viewName

    this.columnNames = Object.keys(view.columns)
    this.columnToPropertyId = this.columnNames.reduce((cols, col) => {
      cols[col] = _.camelCase(col)
      return cols
    }, {})
    this.propertyIdToColumn = Object.entries(this.columnToPropertyId).map(([col, prop]) => [prop, col]).reduce((props, [p, c]) => {
      props[p] = c
      return props
    }, {})
    this.propertyToType = this.columnNames.reduce((cols, col) => {
      cols[this.columnToPropertyId[col]] = view.columns[col].dataType
      return cols
    }, {})

    this.columnNamesWithPropertyAliases = Object.entries(this.columnToPropertyId).map(([col, prop]) => `${col} AS "${prop}"`)
    this.propertyIds = Object.entries(this.columnToPropertyId).filter(([col]) => col[0] !== '_').map(([col, prop]) => prop)

    this.promised = (...args) => promised(this, ...args)
  } // constructor

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

  /// ////////////////////////
  create (jsonData, options = {}, callback = NotSet) {
    if (callback === NotSet) return this.promised(this.create, jsonData, options)
    callback(this.error("Can't create. Views are read-only"))
  } // create

  findById (id, callback = NotSet) {
    if (callback === NotSet) return this.promised(this.findById, id)
    callback(this.error("Can't findById. Views do not have a primary key"))
  } // findById

  update (doc, options, callback = NotSet) {
    if (callback === NotSet) return this.promised(this.update, doc, options)
    callback(this.error("Can't update. Views are read-only"))
  } // update

  patch (doc, options, callback = NotSet) {
    if (callback === NotSet) return this.promised(this.patch, doc, options)
    callback(this.error("Can't patch. Views are read-only"))
  } // patch

  upsert (jsonData, options, callback = NotSet) {
    if (callback === NotSet) return this.promised(this.upsert, jsonData, options)
    callback(this.error("Can't upsert. Views are read-only"))
  } // upsert

  destroyById (id, callback = NotSet) {
    if (callback === NotSet) return this.promised(this.destroyById, id)
    callback(this.error("Can't destroyById. Views are read-only"))
  } // destroyById

  error (msg) {
    const e = new Error(msg)
    e.schema = this.schemaName
    e.view = this.viewName
    return e
  } // error

  debug () {
    console.log('')
    console.log('------------------- ' + this.fullModelId + '-------------------')
    console.log('  propertyIds')
    this.propertyIds.forEach(propertyId => console.log('    + ' + propertyId))

    console.log('  View')
    console.log('    fullViewName: ' + this.fullViewName)
  } // debug
}

module.exports = View
