'use strict'

const _ = require('lodash')
const generateCaseStatement = require('./generate-case-statement')
const generateJoinStatement = require('./generate-join-statement')

module.exports = function generateViewStatement (schemaName, tableToMatchOn, propertyType, columnToMatchOn, rankingFactors, registry, joinParts) {
  let viewStatement = `CREATE OR REPLACE VIEW ${schemaName}.${propertyType}_scores AS `
  let totalScore = `SELECT scores.${columnToMatchOn}, scores.label, `
  let outerSelect = ``
  /*
  * TODO:
  * g.address_label
  * needs to come from somewhere rather than hard-coded
  * */
  let innerSelect = `SELECT g.${columnToMatchOn}, g.address_label as label, `
  let firstCase = true
  _.forEach(rankingFactors, function (v, k) {
    if (!firstCase) {
      innerSelect += ','
      outerSelect += ','
      totalScore += '+'
    }
    totalScore += `scores.${_.snakeCase(k)}_score `
    outerSelect += `scores.${_.snakeCase(k)}_score `
    innerSelect += generateCaseStatement(k, registry.value[k], schemaName, v.model, v.property)
    joinParts.add(generateJoinStatement(registry.value[k], schemaName, v.model, columnToMatchOn))
    firstCase = false
  })

  innerSelect += `FROM ${schemaName}.${tableToMatchOn} g `
  for (const i of joinParts) {
    innerSelect += `${i}`
  }
  /*
  * TODO:
  * rank.ranking_name, ranking_uprns
  * needs to come from somewhere rather than being hard-coded
  * */
  innerSelect += `JOIN ${schemaName}.ranking_uprns rank ON rank.${columnToMatchOn} = g.${columnToMatchOn} `
  innerSelect += `WHERE rank.ranking_name = '${propertyType}'::text `
  totalScore += `as risk_score, `
  viewStatement += totalScore
  viewStatement += outerSelect
  viewStatement += `FROM (${innerSelect}) scores `
  return viewStatement
}
