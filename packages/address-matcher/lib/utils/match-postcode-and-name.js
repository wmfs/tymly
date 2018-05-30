'use strict'

const _ = require('lodash')

function matchPostcodeAndName (options, client) {
  return new Promise((resolve, reject) => {
    client.query(
      match(options, 'exact', 2) + match(options, 'fuzzy', 3),
      (err) => {
        if (err) reject(err)
        else resolve(err)
      }
    )
  })
}

function match (options, type, certainty) {
  let statement = `INSERT INTO ${options.match.schema}.${options.match.table} (${options.source.id}, ${options.target.id}, match_certainty) ` +
    `SELECT source.${options.source.id}, target.${options.target.id}, ${certainty} ` +
    `FROM ${options.source.schema}.${options.source.table} source, ${options.target.schema}.${options.target.table} target ` +
    `WHERE source.${options.match.map.postcode.source} = target.${options.match.map.postcode.target} ` +
    `AND `
  switch (type) {
    case 'exact':
      statement += processWhere('exact', options.match.map.businessName.source, options.match.map.businessName.target)
      break
    case 'fuzzy':
      statement += processWhere('fuzzy', options.match.map.businessName.source, options.match.map.businessName.target)
      break
  }
  statement += `ON CONFLICT (${options.source.id}) do nothing; `
  return statement
}

function processWhere (type, source, target) {
  if (!_.isArray(source)) source = [source]
  if (!_.isArray(target)) target = [target]

  const parts = []
  switch (type) {
    case 'exact':
      source.map(s => {
        target.map(t => {
          parts.push(`upper(${s}) = upper(${t})`)
        })
      })
      break
    case 'fuzzy':
      source.map(s => {
        target.map(t => {
          parts.push(`difference(${s}, ${t}) = 4`)
        })
      })
      break
  }
  return `(${parts.join(' OR ')}) `
}

module.exports = matchPostcodeAndName
matchPostcodeAndName.processWhere = processWhere
