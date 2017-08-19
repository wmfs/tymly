const dottie = require('dottie')
const _ = require('lodash')

module.exports = function processStructure (baseDbStructure, targetDbStructure) {
  const parsed = {}

  function deriveMetaFromPath (path) {
    const meta = {}
    const parts = path.split('.')

    switch (parts.length) {
      case 2:
        meta.type = 'schema'
        meta.id = parts[1]
        break
      case 3:
        if (parts[2] === 'comment') {
          meta.type = 'schemaComment'
          meta.id = parts[1]
        }
        break
      case 4:
        meta.type = 'table'
        meta.id = parts[1] + '.' + parts[3]
        break
      case 5:
        if (parts[4] === 'pkColumnNames') {
          meta.type = 'pkColumnNames'
          meta.id = parts[1] + '.' + parts[3]
        }
        if (parts[4] === 'comment') {
          meta.type = 'tableComment'
          meta.id = parts[1] + '.' + parts[3]
        }
        break
      case 6:
        if (parts[4] === 'columns') {
          meta.type = 'column'
          meta.id = parts[1] + '.' + parts[3] + '.' + parts[5]
        }
        if (parts[4] === 'indexes') {
          meta.type = 'index'
          meta.id = parts[1] + '.' + parts[3] + '.' + parts[5]
        }
        if (parts[4] === 'columns') {
          meta.type = 'column'
          meta.id = parts[1] + '.' + parts[3] + '.' + parts[5]
        }
        if (parts[4] === 'fkConstraints') {
          meta.type = 'fkConstraint'
          meta.id = parts[1] + '.' + parts[3] + '.' + parts[5]
        }
        break
      case 7:
        if (parts[4] === 'columns' && parts[6] === 'comment') {
          meta.type = 'columnComment'
          meta.id = parts[1] + '.' + parts[3] + '.' + parts[5]
        }
    }
    return meta
  }

  function parseObject (path, obj) {
    let property
    let newPath
    let meta
    for (let propertyId in obj) {
      if (obj.hasOwnProperty(propertyId)) {
        property = obj[propertyId]
        if (path) {
          newPath = path + '.' + propertyId
        } else {
          newPath = propertyId
        }

        meta = deriveMetaFromPath(newPath)

        if (meta.hasOwnProperty('type')) {
          parsed[meta.type + '.' + meta.id] = {
            base: dottie.get(baseDbStructure, newPath),
            target: property
          }
        }

        if (_.isObject(property) && !_.isArray(property)) {
          parseObject(newPath, property)
        }
      }
    }
  }

  parseObject(null, targetDbStructure)

  const processed = {}
  for (let id in parsed) {
    if (parsed.hasOwnProperty(id)) {
      const parts = id.split('.')
      const type = parts.shift()
      if (!processed.hasOwnProperty(type)) {
        processed[type] = {}
      }
      processed[type][parts.join('.')] = parsed[id]
    }
  }

  return processed
}
