'use strict'

const _ = require('lodash')

module.exports = function extractModifiers (components) {
  const modifierFunctions = []

  function findModifierFunctions (rootPath, rootObject) {
    if (_.isObject(rootObject) && !_.isArray(rootObject)) {
      let fullPath
      let value
      for (let key in rootObject) {
        if (rootObject.hasOwnProperty(key)) {
          value = rootObject[key]

          if (rootPath) {
            fullPath = rootPath + '.' + key
          } else {
            fullPath = key
          }

          if (key === 'configModifier' && _.isFunction(value)) {
            modifierFunctions.push(value)
          } else {
            findModifierFunctions(fullPath, value)
          }
        }
      }
    }
  }

  findModifierFunctions(null, components)

  return modifierFunctions
}
