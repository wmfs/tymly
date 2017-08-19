'use strict'

const Transform = require('stream').Transform
const _ = require('lodash')
const csvEncoder = require('./simple-csv-encoder')

class Transformer extends Transform {
  constructor (info, table, options) {
    super({objectMode: true})
    this.info = info

    // Let's dynamically create a function that will return an array of
    // output values, ready for stringification.
    const functionStatements = [
      'const csvParts = []'
    ]
    table.csvColumns.forEach(
      function (csvColumnSource) {
        switch (csvColumnSource[0]) {
          case '$':
            const functionName = csvColumnSource.slice(1)
            if (functionName === 'ROW_NUM') {
              functionStatements.push(`csvParts.push(this.info.totalCount)`)
            }
            break
          case '@':
            const columnName = csvColumnSource.slice(1)
            functionStatements.push(`csvParts.push(sourceRow['${columnName}'])`)
            break
          default:
            functionStatements.push(`csvParts.push(${JSON.stringify(csvColumnSource)})`)
        }
      }
    )
    functionStatements.push('return csvParts')

    this.getOutputValues = new Function('sourceRow', functionStatements.join(';\n')) // eslint-disable-line
    this.getOutputValues = _.bind(this.getOutputValues, this)
  }

  _transform (sourceRow, encoding, callback) {
    this.info.totalCount ++
    const outputValues = this.getOutputValues(sourceRow)
    callback(null, csvEncoder(outputValues))
  }
}

module.exports = Transformer
