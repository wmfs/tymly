'use strict'
const hashSum = require('hash-sum')

module.exports = function hashFunction (incomingCsvLine) {
  return hashSum(incomingCsvLine)
}
