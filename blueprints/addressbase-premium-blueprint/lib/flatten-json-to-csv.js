const jp = require('jsonpath')

function transformPaths (contextPath, pathList) {
  return pathList.map(path => path.replace('@', contextPath))
}

function flattenJson (json, ...args) {
  const pathList = args.length === 1 ? args[0] : transformPaths(...args)

  const elements =
    pathList.map(path => jp.query(json, path))

  return elements.join()
} // flattenJson

module.exports = flattenJson
