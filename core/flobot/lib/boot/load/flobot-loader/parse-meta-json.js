'use strict'

const path = require('path')
const messages = require('./../../../startup-messages')

module.exports = function parseBlueprintJson (rootDir, expectedMetaFilename, mandatoryMetaKeys) {
  let parsed

  // TODO: If dir has blueprint.json on the end then don't bother appending.
  const metaJsonPath = path.join(rootDir, expectedMetaFilename)

  try {
    const meta = require(metaJsonPath)
    let mandatoryKey
    let hasMandatoryKeys = true
    for (let i = 0; i < mandatoryMetaKeys.length; i++) {
      mandatoryKey = mandatoryMetaKeys[i]
      if (!meta.hasOwnProperty(mandatoryKey)) {
        hasMandatoryKeys = false
        messages.error(
          {
            name: 'noNamespace',
            message: 'No valid ' + mandatoryKey + ' defined in ' + metaJsonPath
          }
        )
      }
    }

    if (hasMandatoryKeys) {
      parsed = meta
    }
  } catch (err) {
    messages.error(
      {
        name: 'blueprintJsonFail',
        message: 'Unable to load blueprint.json file at ' + metaJsonPath,
        body: err
      }
    )
  }

  return parsed
}
