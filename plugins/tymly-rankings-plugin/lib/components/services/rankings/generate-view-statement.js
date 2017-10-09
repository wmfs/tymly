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

  outerSelect.push(`scores.${options.source['property']}`)
  innerSelect.push(`g.${options.source['property']}`)
  _.forEach(options.source['otherProperties'], function (i) {
    outerSelect.push(`scores.${i}`)
    innerSelect.push(`g.${i} as ${i}`)
  })

  _.forEach(options.ranking, function (v, k) {
    outerSelect.push(`scores.${_.snakeCase(k)}_score`)
    innerSelect.push(generateCaseStatement(_.snakeCase(k), options.registry.value[k], options.schema, _.snakeCase(v.model), _.snakeCase(v.property)))
    totalScore.push(`scores.${_.snakeCase(k)}_score`)
    joinParts.add(generateJoinStatement(options.registry.value[k], options.schema, _.snakeCase(v.model), options.source['property']))
  })
  outerSelect.push(`${totalScore.join('+')} as risk_score`)
  joinParts.add(`JOIN ${options.schema}.ranking_${options.source['property']}s rank ON rank.${options.source['property']} = g.${options.source['property']}`)

  let viewStatement =
    preStatement +
    `SELECT ` +
    outerSelect.join(',') +
    ` FROM ` +
    `(SELECT ` +
    innerSelect.join(',') +
    ` FROM ${options.schema}.${options.source['model']} g `

  for (const i of joinParts) {
    viewStatement += `${i} `
  }

  viewStatement += postStatement
  return viewStatement
}
