'use strict'

const path = require('path')

module.exports = function defaultFileLoader (blueprintMeta, originalKey, filePath) {
  const ext = path.extname(filePath)

  const keyParts = [
    blueprintMeta.namespace,
    originalKey
  ]

  return {
    key: keyParts.join('_') + ext,
    content: {
      filePath: filePath,
      filename: path.basename(filePath),
      namespace: blueprintMeta.namespace,
      ext: ext
    }
  }
}
