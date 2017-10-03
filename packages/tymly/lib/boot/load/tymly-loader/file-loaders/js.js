'use strict'

const messages = require('./../../../../startup-messages')

module.exports = function jsFileLoader (blueprintMeta, originalKey, jsFilePath) {
  let loaded

  try {
    const closure = require(jsFilePath)
    const keyParts = [
      blueprintMeta.namespace,
      originalKey
    ]

    loaded = {
      key: keyParts.join('_'),
      content: closure
    }
  } catch (err) {
    messages.error(
      {
        name: 'jsFileLoadFail',
        message: 'Unable to load .JS file at ' + jsFilePath,
        body: err
      }
    )
  }

  return loaded
}
