'use strict'

const csvStringify = require('csv-string').stringify
const hashFunction = require('./hash-function')

class Transformer {
  constructor (fileConfig) {
    const _this = this
    this.columnFunctions = []
    if (fileConfig.hasOwnProperty('outputColumns')) {
      fileConfig.outputColumns.forEach(
        function (outputColumnConfig) {
          const outputColumnType = outputColumnConfig.type || 'columnIndex'

          switch (outputColumnType) {
            case 'columnIndex':
              _this.columnFunctions.push(Transformer.getColumnIndexOutput(outputColumnConfig.columnIndex))
              break
            case 'hash':
              _this.columnFunctions.push(hashFunction)
              break
            default:
              console.error('ERROR: Unknown outputColumnType ' + outputColumnType)
          }
        }
      )
    }
    this.hasColumnFunctions = this.columnFunctions.length > 0
  }

  static getColumnIndexOutput (columnIndex) {
    return function columnIndexOutput (incomingCsvLine) {
      return incomingCsvLine[columnIndex]
    }
  }

  transform (incomingCsvLine) {
    if (this.hasColumnFunctions) {
      const values = []
      this.columnFunctions.forEach(
        function (columnFunction) {
          values.push(columnFunction(incomingCsvLine))
        }
      )
      return csvStringify(values)
    } else {
      return csvStringify(incomingCsvLine)
    }
  }
}

module.exports = Transformer
