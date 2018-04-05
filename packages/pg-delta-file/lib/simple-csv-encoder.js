
const _ = require('lodash')
module.exports = function (csvParts) {
  let quoted = []
  csvParts.forEach(
    function (cell) {
      if (_.isNull(cell) || _.isUndefined(cell)) {
        quoted.push('')
      } else if (_.isString(cell)) {
        quoted.push('"' + cell + '"')
      } else {
        quoted.push(cell)
      }
    }
  )

  return quoted.join(',') + '\n'
}
