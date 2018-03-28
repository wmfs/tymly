/* eslint-env mocha */

'use strict'

const statementGenerators = require('./statement-generators/index')

const TYPES = [
  'schema',
  'schemaComment',
  'table',
  'tableComment',
  'column',
  'columnComment',
  'pkColumnNames',
  'index',
  'fkConstraint',
  'view'
]

const processStructures = require('./process-structures')

module.exports = function newDiff (baseDbStructure, targetDbStructure) {
  const processed = processStructures(baseDbStructure, targetDbStructure)

  const statements = []

  TYPES.forEach(typeName => {
    for (const componentId in processed[typeName]) {
      const component = processed[typeName][componentId]
      if (component) {
        statementGenerators[typeName](componentId, component, statements)
      } // if ...
    } // for ...
  })

  return statements
}
