const _ = require('lodash')
const ctxUtils = require('./utils')

module.exports = function applyModifiers (modificationFunctions, blueprintComponents, pluginComponents, meta) {
  function processObject (rootPath, rootObject, modificationFunction) {
    if (_.isObject(rootObject) && !_.isArray(rootObject)) {
      let fullPath
      let value
      let parts

      for (let key in rootObject) {
        if (rootObject.hasOwnProperty(key)) {
          value = rootObject[key]

          if (rootPath) {
            fullPath = rootPath + '.' + key
          } else {
            fullPath = key
          }

          parts = fullPath.split('.')

          modificationFunction(
            {
              componentName: parts[0],
              componentId: parts[1],
              key: key,
              value: value,
              componentPath: parts,
              blueprintComponents: blueprintComponents,
              pluginComponents: pluginComponents,
              utils: ctxUtils,
              meta: meta
            }
          )

          processObject(fullPath, value, modificationFunction)
        }
      }
    }
  }

  for (let i = 0; i < modificationFunctions.length; i++) {
    processObject(null, blueprintComponents, modificationFunctions[i])
  }
}

