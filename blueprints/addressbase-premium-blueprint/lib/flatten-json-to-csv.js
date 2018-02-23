const jp = require('jsonpath')

function transformPath (path, contextPath = '$') {
  if (typeof path === 'string') {
    return jsonQueryOp(path.replace('@', contextPath))
  }

  // ok, it's a conditional
  validateConditional(path)
  return jsonConditionalOp(path, contextPath)
} // transformPath

function validateConditional (cond) {
  if (!cond.test) {
    throw new Error('Conditional must have test')
  }
  if (!cond.value) {
    throw new Error('Conditional must have value')
  }
} // validateConditional

function transformPaths (pathList, contextPath) {
  return pathList.map(path => transformPath(path, contextPath))
} // transformPaths

/// /////////////////////
function jsonQueryOp (path) {
  return json => evalJsonQuery(json, path)
} // jsonQuery

function evalJsonQuery (json, path) {
  return jp.query(json, path)
} // evalJsonQuery

function jsonConditionalOp (path, contextPath) {
  return json => evalJsonConditional(json, path, contextPath)
} // jsonConditionalOp

function evalJsonConditional (json, path, contextPath) {
  const contextNode = evalJsonQuery(json, contextPath)
  if (!contextNode) return null

  const wrapped = {
    wrap: contextNode
  }
  const testExpr = `$.wrap[?(${path.test})]`
  const testResult = evalJsonQuery(wrapped, testExpr)

  return (testResult.length) ? path.value : null
} // evalJsonConditional

/// /////////////////////
function flattenJson (json, ...args) {
  const contextPath = args.length === 2 ? args[0] : null
  const paths = args.length === 2 ? args[1] : args[0]

  const queries = transformPaths(paths, contextPath)

  const elements = queries.map(query => query(json))

  return elements.join()
} // flattenJson

module.exports = flattenJson
