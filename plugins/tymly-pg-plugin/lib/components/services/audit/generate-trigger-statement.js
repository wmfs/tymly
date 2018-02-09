'use strict'

const _ = require('lodash')
const debug = require('debug')('tymly-pg-plugin')

module.exports = function generateTriggerStatement (options) {
  const namespace = _.snakeCase(options.model.namespace)
  const name = _.snakeCase(options.model.name)
  const pk = _.snakeCase(options.model.primaryKey)

  switch (options.action) {
    case 'ADD':
      debug(`add trigger for ${options.function} on ${options.model.namespace}_${options.model.name}`)
      return `CREATE TRIGGER ${namespace}_${name}_auditor 
      BEFORE UPDATE ON ${namespace}.${name} 
      FOR EACH ROW EXECUTE PROCEDURE 
      tymly.${_.snakeCase(options.function)}('${namespace}.${name}', '{${pk}}');`
    case 'REMOVE':
      debug(`remove trigger for ${options.function} on ${options.model.namespace}_${options.model.name}`)
      return `DROP TRIGGER IF EXISTS ${namespace}_${name}_auditor
      ON ${namespace}.${name};`
    default:
      return ``
  }
}
