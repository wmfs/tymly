const _ = require('lodash')

module.exports = function isDifferent (value1, value2) {
  if (_.isArray(value1) && _.isArray(value2)) {
    // Compare arrays (no matter of element order)
    const sorted1 = value1.sort()
    const sorted2 = value2.sort()
    return !_.isEqual(sorted1, sorted2)
  } else {
    if (value1 === undefined) {
      value1 = null
    }
    if (value2 === undefined) {
      value2 = null
    }

    return ((_.isNull(value1) && !_.isNull(value2)) || (!_.isNull(value1) && _.isNull(value2)) || (value1 !== value2))
  }
}
