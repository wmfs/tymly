'use strict'

const _ = require('lodash')

module.exports = function generateTriggerStatement (options) {
  const namespace = _.snakeCase(options.model.namespace)
  const name = _.snakeCase(options.model.name)
  const pk = _.snakeCase(options.model.primaryKey)

  switch (options.action) {
    case 'ADD':
      return `CREATE TRIGGER ${namespace}_${name}_auditor 
      BEFORE UPDATE ON ${namespace}.${name} 
      FOR EACH ROW EXECUTE PROCEDURE 
      tymly.${_.snakeCase(options.function)}('${namespace}.${name}', '{${pk}}');`
    case 'REMOVE':
      return `DROP TRIGGER IF EXISTS ${namespace}_${name}_auditor
      ON ${namespace}.${name};`
    default:
      return ``
  }
}
