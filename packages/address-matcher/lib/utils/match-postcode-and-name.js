'use strict'

const _ = require('lodash')

function matchPostcodeAndName (options, client, callback) {
  client.query(
    generateStatement(options),
    (err) => {
      callback(err)
    }
  )
}

function generateStatement (options) {
  return `INSERT INTO ${options.link.schema}.${options.link.table} (${options.source.id}, ${options.target.id}, match_certainty) ` +
    `SELECT source.${options.source.id}, target.${options.target.id}, 2 ` +
    `FROM ${options.source.schema}.${options.source.table} source, ${options.target.schema}.${options.target.table} target ` +
    `WHERE source.${options.link.map.postcode.source} = target.${options.link.map.postcode.target} ` +
    `AND ` + processWherePart(options.link.map.businessName.source, options.link.map.businessName.target) +
    `ON CONFLICT (${options.source.id}) do nothing;`
}

function processWherePart (source, target) {
  let statement = ``
  if (_.isArray(source)) {
    const parts = []
    source.map(s => {
      if (_.isArray(target)) {
        target.map(t => {
          parts.push(`upper(${s}) = ${t}`)
          parts.push(`difference(${s}, ${t}) = 4`)
        })
      } else {
        parts.push(`upper(${s}) = ${target}`)
        parts.push(`difference(${s}, ${target}) = 4`)
      }
    })
    statement += `(${parts.join(' OR ')}) `
  } else {
    if (_.isArray(target)) {
      const parts = []
      target.map(t => {
        parts.push(`upper(${source}) = ${t}`)
        parts.push(`difference(${source}, ${t}) = 4`)
      })
      statement += `(${parts.join(' OR ')}) `
    } else {
      statement += `(upper(${source}) = upper(${target}) OR difference(${source}, ${target}) = 4 ) `
    }
  }
  return statement
}

module.exports = matchPostcodeAndName
matchPostcodeAndName.processWherePart = processWherePart
matchPostcodeAndName.generateStatement = generateStatement
