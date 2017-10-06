'use strict'

const _ = require('lodash')
const generateCaseStatement = require('./generate-case-statement')
const generateJoinStatement = require('./generate-join-statement')

module.exports = function generateViewStatement (options) {
  let preStatement = `CREATE OR REPLACE VIEW ${options.schema}.${options.propertyType}_scores AS `
  let outerSelect = []
  let totalScore = []
  let innerSelect = []
  let joinParts = new Set()
  let postStatement = `WHERE rank.ranking_name = '${options.propertyType}'::text ) scores`

  outerSelect.push(`scores.${options.columnToMatch}`)
  outerSelect.push(`scores.label`)
  innerSelect.push(`g.${options.columnToMatch}`)
  innerSelect.push(`g.address_label as label`) // TODO: g.address_label

  _.forEach(options.ranking, function (v, k) {
    outerSelect.push(`scores.${_.snakeCase(k)}_score`)
    innerSelect.push(generateCaseStatement(k, options.registry.value[k], options.schema, v.model, v.property))
    totalScore.push(`scores.${_.snakeCase(k)}_score`)
    joinParts.add(generateJoinStatement(options.registry.value[k], options.schema, v.model, options.columnToMatch))
  })
  outerSelect.push(`${totalScore.join('+')} as risk_score`)
  joinParts.add(`JOIN ${options.schema}.ranking_${options.columnToMatch}s rank ON rank.${options.columnToMatch} = g.${options.columnToMatch}`)

  let viewStatement =
    preStatement +
    `SELECT ` +
    outerSelect.join(',') +
    ` FROM ` +
    `(SELECT ` +
    innerSelect.join(',') +
    ` FROM ${options.schema}.${options.tableToMatch} g `

  for (const i of joinParts) {
    viewStatement += `${i} `
  }

  viewStatement += postStatement
  return viewStatement
}
