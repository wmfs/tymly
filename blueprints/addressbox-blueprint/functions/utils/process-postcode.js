'use strict'
const _ = require('lodash')
module.exports = function processPostcode (postcodeString) {
  if (postcodeString === undefined) {
    postcodeString = null
  }
  let postcode = postcodeString
  if (postcodeString !== null && postcodeString !== 'null') {
    postcode = _.toUpper(postcode)
    postcode = _.trim(postcode)
    postcode = postcode.replace(' ', '')
    let part1 = postcode.substring(postcode.length - 3)
    let part2 = postcode.substring(0, 3)
    postcode = part2 + ' ' + part1
  }
  return postcode
}
