'use strict'
const _ = require('lodash')
module.exports = function turnEmptyNone (inputString) {
  let outputString = inputString
  if (inputString !== null) {
    outputString = _.trim(outputString)
    if (outputString === '') {
      outputString = null
    }
  }
  return outputString
}
