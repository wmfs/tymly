'use strict'

const _ = require('lodash')
const stats = require('stats-lite')

module.exports = function generateStats (options) {
  return new Promise((resolve, reject) => {
    console.log(options.category)
    let scores = []
    let ranges

    // TODO: 'risk' in risk_score should be inferred
    let getScoresSQL = `SELECT risk_score FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores`

    // Get the scores to perform statistics on
    options.client.query(
      getScoresSQL,
      function (err, result) {
        if (err) return reject(err)
        result.rows.map(r => scores.push(r.risk_score))

        const mean = stats.mean(scores)
        const stdev = stats.stdev(scores)

        if (scores.length > 0) {
          // Create the sector boundaries
          if (scores.length > 10000) {
            ranges = {
              veryLow: {
                lowerBound: 0,
                upperBound: (+mean - (2 * +stdev)).toFixed(2)
              },
              low: {
                lowerBound: (+mean - (2 * +stdev) + +0.01).toFixed(2),
                upperBound: (+mean - +stdev).toFixed(2)
              },
              medium: {
                lowerBound: (+mean - +stdev + +0.01).toFixed(2),
                upperBound: (+mean + +stdev).toFixed(2)
              },
              high: {
                lowerBound: (+mean + +stdev + +0.01).toFixed(2),
                upperBound: (+mean + (2 * +stdev)).toFixed(2)
              },
              veryHigh: {
                lowerBound: (+mean + (2 * +stdev) + +0.01).toFixed(2),
                upperBound: Math.max(...scores)
              }
            }
          } else {
            ranges = {
              low: {
                lowerBound: 0,
                upperBound: (+mean - +stdev).toFixed(2)
              },
              medium: {
                lowerBound: (+mean - +stdev + +0.01).toFixed(2),
                upperBound: (+mean + +stdev).toFixed(2)
              },
              high: {
                lowerBound: (+mean + +stdev + +0.01).toFixed(2),
                upperBound: Math.max(...scores)
              }
            }
          }

          console.log(ranges)

          // Get rows from view
          // Find range based on risk_score
          // Update range in view with uprn

          // Create statistics table (if not exists) and upsert row for statistic of this category
          let statements = `
          CREATE TABLE IF NOT EXISTS ${_.snakeCase(options.schema)}.${_.snakeCase(options.name)}_stats (category text not null primary key, count numeric, mean numeric, median numeric, variance numeric, stdev numeric); 
          INSERT INTO ${_.snakeCase(options.schema)}.${_.snakeCase(options.name)}_stats (category, count, mean, median, variance, stdev)
          VALUES ('${_.kebabCase(options.category)}', ${scores.length}, ${mean.toFixed(2)}, ${stats.median(scores).toFixed(2)},
          ${stats.variance(scores).toFixed(2)}, ${stdev.toFixed(2)})
          ON CONFLICT (category) DO UPDATE SET
          count = ${scores.length},
          mean = ${mean.toFixed(2)},
          median = ${stats.median(scores).toFixed(2)},
          variance = ${stats.variance(scores).toFixed(2)},
          stdev = ${stdev.toFixed(2)};
          `

          options.client.query(
            statements,
            function (err) {
              if (err) return reject(err)
              resolve()
            }
          )
        }
      }
    )
  })
}
