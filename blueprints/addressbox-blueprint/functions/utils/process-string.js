'use strict'
const _ = require('lodash')
module.exports = function processString (inputString) {
  if (inputString === undefined) {
    inputString = null
  }
  let outputString = inputString
  if (inputString !== null) {
    outputString = outputString.replace(',', ' ')
    outputString = outputString.split(' ').map(_.capitalize).join(' ')
  }
  return outputString
}
