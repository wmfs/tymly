
const _ = require('lodash')

module.exports = function jsonFileLoader (blueprintMeta, originalKey, jsonFilePath, messages) {
  let loaded

  try {
    let json = require(jsonFilePath)
    json = _.cloneDeep(json)

    if (!json.hasOwnProperty('namespace')) {
      json.namespace = blueprintMeta.namespace
    }

    if (!json.hasOwnProperty('id')) {
      json.id = originalKey
    }

    if (!json.hasOwnProperty('name')) {
      json.name = originalKey
    }

    const keyParts = [
      blueprintMeta.namespace,
      originalKey
    ]

    if (json.hasOwnProperty('version')) {
      keyParts.push(json.version.replace('.', '_'))
    }

    loaded = {
      key: keyParts.join('_'),
      content: json
    }
  } catch (err) {
    messages.error(
      {
        name: 'jsonFileLoadFail',
        message: 'Unable to load JSON file at ' + jsonFilePath,
        body: err
      }
    )
  }

  return loaded
}
