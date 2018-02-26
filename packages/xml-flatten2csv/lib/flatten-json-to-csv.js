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
  if (!cond.value && !cond.select) {
    throw new Error('Conditional must have value or select')
  }
  if (cond.value && cond.select) {
    throw new Error('Conditional can not have value and select')
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
  return json => evalJsonConditional(
    json,
    evalJsonQuery(json, contextPath),
    path.test,
    path.value,
    path.select ? transformPath(path.select, contextPath) : null
  )
} // jsonConditionalOp

function evalJsonConditional (json, contextNode, test, value, select) {
  if (!contextNode) return null

  const wrapped = {
    wrap: contextNode
  }
  const testExpr = `$.wrap[?(${test})]`
  const testResult = evalJsonQuery(wrapped, testExpr)

  if (!testResult.length) return null
  return value || select(json)
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
