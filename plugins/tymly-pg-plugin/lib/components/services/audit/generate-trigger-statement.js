'use strict'

const _ = require('lodash')

module.exports = function generateTriggerStatement (model, func, action) {
  const namespace = _.snakeCase(model.namespace)
  const name = _.snakeCase(model.name)
  const pk = _.snakeCase(model.primaryKey)

  switch (action) {
    case 'ADD':
      return `CREATE TRIGGER ${namespace}_${name}_auditor 
      BEFORE UPDATE ON ${namespace}.${name} 
      FOR EACH ROW EXECUTE PROCEDURE 
      tymly.${_.snakeCase(func)}('${namespace}.${name}', '{${pk}}');`
    case 'REMOVE':
      return `DROP TRIGGER IF EXISTS ${namespace}_${name}_auditor
      ON ${namespace}.${name};`
  }
}
