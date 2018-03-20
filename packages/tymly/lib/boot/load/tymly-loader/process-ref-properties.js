'use strict'

const messages = require('./../../../startup-messages')
const _ = require('lodash')

module.exports = function (blueprintComponents, refProperties, pluginComponents, parsedMetaJson) {
  function getFullReference (componentType, refName) {
    let matchedValue
    if (blueprintComponents[componentType]) {
      _.forOwn(blueprintComponents[componentType], (component, fullReference) => {
        if (component.id === refName) matchedValue = fullReference
        else if (component.id === refName.split('_')[1]) matchedValue = fullReference
      })
    }
    return matchedValue
  }

  function checkReference (root, key, value) {
    const fullReference = getFullReference(refProperties[key], value)

    if (!fullReference) {
      messages.error({
        name: 'referencePropertyFail',
        message: `Unable to establish full reference for ${refProperties[key]} with id '${value}'`
      })
    } else if (key !== 'categories') {
      root[key] = fullReference
    }
  }

  function scan (root) {
    if (_.isArray(root)) {
      root.forEach((element) => {
        scan(element)
      })
    } else if (_.isObject(root)) {
      _.forOwn(root, (value, key) => {
        if (refProperties[key] && _.isString(value) && value !== '*') {
          checkReference(root, key, value)
        } else if (refProperties[key] && _.isArray(value)) {
          value.map(val => checkReference(root, key, val))
        } else {
          scan(value)
        }
      })
    }
  }

  scan(blueprintComponents)
}
