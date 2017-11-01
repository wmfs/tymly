'use strict'

const _ = require('lodash')
const stats = require('stats-lite')

module.exports = function generateStats (options) {
  return new Promise((resolve, reject) => {
    let scores = []

    // TODO: 'risk' in risk_score should be inferred
    let getScoresSQL = `SELECT risk_score FROM ${_.snakeCase(options.schema)}.${_.snakeCase(options.category)}_scores`

    // Get the scores to perform statistics on
    options.client.query(
      getScoresSQL,
      function (err, result) {
        if (err) return reject(err)
        result.rows.map(r => {
          scores.push(r.risk_score)
        })

        if (scores.length > 0) {
          // Create statistics table and upsert row for statistic of this category
          let statements = `
          CREATE TABLE IF NOT EXISTS ${_.snakeCase(options.schema)}.${_.snakeCase(options.name)}_stats (category text not null primary key, mean numeric, median numeric, variance numeric, stdev numeric); 
          INSERT INTO ${_.snakeCase(options.schema)}.${_.snakeCase(options.name)}_stats (category, mean, median, variance, stdev)
          VALUES ('${_.kebabCase(options.category)}', ${stats.mean(scores).toFixed(2)}, ${stats.median(scores).toFixed(2)},
          ${stats.variance(scores).toFixed(2)}, ${stats.stdev(scores).toFixed(2)})
          ON CONFLICT (category) DO UPDATE SET
          mean = ${stats.mean(scores).toFixed(2)},
          median = ${stats.median(scores).toFixed(2)},
          variance = ${stats.variance(scores).toFixed(2)},
          stdev = ${stats.stdev(scores).toFixed(2)};
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
