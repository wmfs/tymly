const dottie = require('dottie')

function isObject (value) {
  return (value != null) && (typeof value === 'object')
}

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
      meta.type = (parts[2] === 'views') ? 'view' : 'table'
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
      if (parts[2] === 'views') {
        break
      }
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
} // deriveMetaFromPath

function parseObject (baseDbStructure, path, obj, parsed) {
  for (const [propertyId, property] of Object.entries(obj)) {
    const newPath = path ? path + '.' + propertyId : propertyId
    const meta = deriveMetaFromPath(newPath)

    if (meta.hasOwnProperty('type')) {
      parsed[meta.type + '.' + meta.id] = {
        base: dottie.get(baseDbStructure, newPath),
        target: property
      }
    }

    if (isObject(property) && !Array.isArray(property)) {
      parseObject(baseDbStructure, newPath, property, parsed)
    }
  }
} // parseObject

function parseStructure (baseDbStructure, obj) {
  const parsed = {}

  parseObject(baseDbStructure, null, obj, parsed)

  return parsed
} // parseStructure

module.exports = function processStructure (baseDbStructure, targetDbStructure) {
  const parsed = parseStructure(baseDbStructure, targetDbStructure)

  const processed = {}
  for (const id of Object.keys(parsed)) {
    const parts = id.split('.')
    const type = parts.shift()
    if (!processed[type]) {
      processed[type] = {}
    }
    processed[type][parts.join('.')] = parsed[id]
  }
  return processed
} // processStructure
