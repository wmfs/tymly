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
  'fkConstraint'
]

const processStructures = require('./process-structures')

module.exports = function newDiff (baseDbStructure, targetDbStructure) {
  const processed = processStructures(baseDbStructure, targetDbStructure)

  const statements = []
  let component

  TYPES.forEach(
    function (typeName) {
      if (processed.hasOwnProperty(typeName)) {
        for (let componentId in processed[typeName]) {
          if (processed[typeName].hasOwnProperty(componentId)) {
            component = processed[typeName][componentId]
            statementGenerators[typeName](componentId, component, statements)
          }
        }
      }
    }
  )

  return statements
}
