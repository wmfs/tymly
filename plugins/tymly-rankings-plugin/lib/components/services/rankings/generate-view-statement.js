'use strict'

const _ = require('lodash')
const generateCaseStatement = require('./generate-case-statement')
const generateJoinStatement = require('./generate-join-statement')

module.exports = function generateViewStatement (schemaName, tableToMatchOn, propertyType, columnToMatchOn, rankingFactors, registry) {
  let preStatement = `CREATE OR REPLACE VIEW ${schemaName}.${propertyType}_scores AS `
  let outerSelect = []
  let totalScore = []
  let innerSelect = []
  let joinParts = new Set()
  let postStatement = `WHERE rank.ranking_name = 'factory'::text ) scores`

  outerSelect.push(`scores.${columnToMatchOn}`)
  outerSelect.push(`scores.label`)
  innerSelect.push(`g.${columnToMatchOn}`)
  innerSelect.push(`g.address_label as label`) // TODO: g.address_label

  _.forEach(rankingFactors, function (v, k) {
    outerSelect.push(`scores.${_.snakeCase(k)}_score`)
    innerSelect.push(generateCaseStatement(k, registry.value[k], schemaName, v.model, v.property))
    totalScore.push(`scores.${_.snakeCase(k)}_score`)
    joinParts.add(generateJoinStatement(registry.value[k], schemaName, v.model, columnToMatchOn))
  })
  outerSelect.push(`${totalScore.join('+')} as risk_score`)
  joinParts.add(`JOIN ${schemaName}.ranking_uprns rank ON rank.${columnToMatchOn}`) // TODO: rank.ranking_name, ranking_uprns

  let viewStatement =
    preStatement +
    'SELECT ' +
    outerSelect.join(',') +
    ' FROM ' +
    '(SELECT ' +
    innerSelect.join(',') +
    ` FROM ${schemaName}.${tableToMatchOn} g `

  for (const i of joinParts) {
    viewStatement += `${i} `
  }

  viewStatement += postStatement
  return viewStatement
}
