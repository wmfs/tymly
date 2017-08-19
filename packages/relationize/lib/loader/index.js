/* eslint-env mocha */
'use strict'

const loadFromSchemaFiles = require('./load-from-schema-files')

module.exports = function schemaAudit (options, callback) {
  const schemas = []

  function finish () {
    if (options.source.hasOwnProperty('schemas')) {
      options.source.schemas.forEach(
        function (schemaInfo) {
          schemas.push(
            {
              namespace: schemaInfo.namespace,
              content: schemaInfo.schema
            }
          )
        }
      )
    }
    callback(null, schemas)
  }

  if (options.source.hasOwnProperty('paths')) {
    loadFromSchemaFiles(
      schemas,
      options,
      function (err) {
        if (err) {
          callback(err)
        } else {
          finish()
        }
      }
    )
  } else {
    finish()
  }
}
