const jp = require('jsonpath')

function flattenJson (json, pathList) {
  const elements =
    pathList.map(path => jp.query(json, path))

  return elements.join()
} // flattenJson

module.exports = flattenJson
