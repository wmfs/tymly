const _ = require('lodash')

module.exports = function calculateContentmentLevel () {
  return _.random(0, 2)
}
