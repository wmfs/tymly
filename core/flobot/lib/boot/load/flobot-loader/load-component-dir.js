'use strict'

const messages = require('./../../../startup-messages')
const _ = require('lodash')

module.exports = function loadComponentDir (blueprintMeta, originalKey, rootDirPath) {
  let loaded

  try {
    let source = require(rootDirPath)
    source = _.cloneDeep(source)

    const keyParts = []
    if (blueprintMeta) {
      if (blueprintMeta.hasOwnProperty('namespace')) {
        keyParts.push(blueprintMeta.namespace)
      }
    }
    if (_.isObject(source) && source.hasOwnProperty('componentName')) {
      keyParts.push(source.componentName)
    } else {
      keyParts.push(originalKey)
    }

    loaded = {
      key: keyParts.join('_'),
      content: {
        rootDirPath: rootDirPath,
        componentModule: source
      }
    }
  } catch (err) {
    messages.error(
      {
        name: 'componentDirFail',
        message: 'Unable to load component from ' + rootDirPath,
        body: err
      }
    )
  }

  return loaded
}
