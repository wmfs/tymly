'use strict'
const messages = require('./../../../startup-messages')
const _ = require('lodash')
module.exports = function (blueprintComponents, refProperties, pluginComponents, parsedMetaJson) {
  function getFullReference (componentType, refName) {
    let matchedValue
    if (blueprintComponents.hasOwnProperty(componentType)) {
      _.forOwn(
        blueprintComponents[componentType],
        function (component, fullReference) {
          if (component.id === refName) {
            matchedValue = fullReference
          }
        }
      )
    }
    return matchedValue
  }

  function scan (root) {
    if (_.isArray(root)) {
      root.forEach(
        function (element) {
          scan(element)
        }
      )
    } else if (_.isObject(root)) {
      _.forOwn(
        root,
        function (value, key) {
          if (refProperties.hasOwnProperty(key) && _.isString(value) && value !== '*') {
            const fullReference = getFullReference(refProperties[key], value)
            if (fullReference) {
              root[key] = fullReference
            } else {
              messages.error(
                {
                  name: 'referencePropertyFail',
                  message: `Unable to establish full reference for ${refProperties[key]} with id '${value}'`
                }
              )
            }
          } else {
            scan(value)
          }
        }
      )
    }
  }

  scan(blueprintComponents)
}
