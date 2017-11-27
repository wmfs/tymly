'use strict'

const _ = require('lodash')

function matchPostcodeAndName (options, client, callback) {
  client.query(
    match(options, 'exact', 2) + match(options, 'fuzzy', 3),
    (err) => {
      callback(err)
    }
  )
}

function match (options, type, certainty) {
  let statement = `INSERT INTO ${options.link.schema}.${options.link.table} (${options.source.id}, ${options.target.id}, match_certainty) ` +
    `SELECT source.${options.source.id}, target.${options.target.id}, ${certainty} ` +
    `FROM ${options.source.schema}.${options.source.table} source, ${options.target.schema}.${options.target.table} target ` +
    `WHERE source.${options.link.map.postcode.source} = target.${options.link.map.postcode.target} ` +
    `AND `
  switch (type) {
    case 'exact':
      statement += processExactWhere(options.link.map.businessName.source, options.link.map.businessName.target)
      break
    case 'fuzzy':
      statement += processFuzzyWhere(options.link.map.businessName.source, options.link.map.businessName.target)
      break
  }
  statement += `ON CONFLICT (${options.source.id}) do nothing; `
  return statement
}

function processExactWhere (source, target) {
  let statement = ``
  if (_.isArray(source)) {
    const parts = []
    source.map(s => {
      if (_.isArray(target)) {
        target.map(t => {
          parts.push(`upper(${s}) = upper(${t})`)
        })
      } else {
        parts.push(`upper(${s}) = upper(${target})`)
      }
    })
    statement += `(${parts.join(' OR ')}) `
  } else {
    if (_.isArray(target)) {
      const parts = []
      target.map(t => {
        parts.push(`upper(${source}) = upper(${t})`)
      })
      statement += `(${parts.join(' OR ')}) `
    } else {
      statement += `(upper(${source}) = upper(${target}) `
    }
  }
  return statement
}

function processFuzzyWhere (source, target) {
  let statement = ``
  if (_.isArray(source)) {
    const parts = []
    source.map(s => {
      if (_.isArray(target)) {
        target.map(t => {
          parts.push(`difference(${s}, ${t}) = 4`)
        })
      } else {
        parts.push(`difference(${s}, ${target}) = 4`)
      }
    })
    statement += `(${parts.join(' OR ')}) `
  } else {
    if (_.isArray(target)) {
      const parts = []
      target.map(t => {
        parts.push(`difference(${source}, ${t}) = 4`)
      })
      statement += `(${parts.join(' OR ')}) `
    } else {
      statement += ` difference(${source}, ${target}) = 4 ) `
    }
  }
  return statement
}

module.exports = matchPostcodeAndName
matchPostcodeAndName.processExactWhere = processExactWhere
matchPostcodeAndName.processFuzzyWhere = processFuzzyWhere
