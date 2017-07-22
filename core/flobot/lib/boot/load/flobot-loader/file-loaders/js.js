'use strict'

const messages = require('./../../../../startup-messages')

module.exports = function jsFileLoader (blueprintMeta, originalKey, jsFilePath) {
  let loaded

  try {
    const func = require(jsFilePath)

    const keyParts = [
      blueprintMeta.namespace,
      originalKey
    ]

    loaded = {
      key: keyParts.join('_'),
      content: func
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
