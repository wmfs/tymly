'use strict'

const _ = require('lodash')

module.exports = function generateTriggerStatement (model, func) {
  const namespace = _.snakeCase(model.namespace)
  const name = _.snakeCase(model.name)
  const pk = _.snakeCase(model.primaryKey)

  return `CREATE TRIGGER ${namespace}_${name}_auditor 
  BEFORE UPDATE ON ${namespace}.${name} 
  FOR EACH ROW EXECUTE PROCEDURE 
  tymly.${_.snakeCase(func)}('${namespace}.${name}', '{${pk}}');`
}
