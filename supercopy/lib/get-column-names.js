
// TODO: Known issues with first-line: https://github.com/KenanY/first-line/issues/8
const firstLine = require('first-line')
const csvParse = require('csv-string').parse
const _ = require('lodash')

module.exports = function getColumnNames (filePath, options, callback) {
  firstLine(
    filePath,
    function (err, line) {
      if (err) {
        callback(err)
      } else {
        const PK_COLUMN_PREFIX = options.headerColumnNamePkPrefix || '.'

        const columnNames = {
          all: [],
          pk: [],
          attributes: []
        }
        const parsed = csvParse(line.toString())[0]

        for (let i = 0; i < parsed.length; i++) {
          parsed[i] = _.trim(parsed[i])
        }

        parsed.forEach(
          function (rawColumnName) {
            if (rawColumnName[0] === PK_COLUMN_PREFIX) {
              const trimmed = rawColumnName.substring(1)
              columnNames.all.push(trimmed)
              columnNames.pk.push(trimmed)
            } else {
              columnNames.all.push(rawColumnName)
              columnNames.attributes.push(rawColumnName)
            }
          }
        )

        callback(null, columnNames)
      }
    }
  )
}
