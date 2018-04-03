const jp = require('jsonpath')

function transformPath (path, contextPath = '$') {
  if (typeof path === 'string') {
    return jsonQueryOp(path[0] === '@' ? path.replace('@', contextPath) : path)
  }

  // ok, it's a conditional
  validateConditional(path)

  if (path.select && !path.test) {
    return jsonTransformOp(path, contextPath)
  }
  return jsonConditionalOp(path, contextPath)
} // transformPath

function validateConditional (cond) {
  if (!cond.test && !cond.transform) {
    throw new Error('Operation must have test and/or transform')
  }

  if (cond.value) {
    if (cond.transform) {
      throw new Error('Transform can not have a value, it can only have a select')
    }
    if (cond.test && cond.select) {
      throw new Error('Test can not have value and select')
    }
  }

  if (!cond.value && !cond.select) {
    throw new Error('Operation must have value or select')
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
  const result = jp.query(json, path)
  if (result.length === 0 && hasSubSelect(path))
    return evalJsonQueryWithSubSelect(json, path)
  return result
} // evalJsonQuery

function evalJsonQueryWithSubSelect (json, path) {
  const pathToElements = path.substr(0, path.indexOf('[?'))
  const elements = jp.query(json, pathToElements)
  if (elements.length !== 1)
    return [] // we already had the right result
  const original = jp.value(json, pathToElements, elements)
  const result = jp.query(json, path)
  jp.value(json, pathToElements, original)
  return result
} // evalJsonQueryWithSubSelect

function hasSubSelect (path) {
  return (path.indexOf('[?') !== -1) &&
    (path.indexOf('$.wrap') === -1)
} // hasSubSelect

const identityFn = v => v

function jsonConditionalOp (path, contextPath) {
  return json => evalJsonConditional(
    json,
    evalJsonQuery(json, contextPath),
    path.test,
    path.transform ? path.transform : identityFn,
    path.value,
    path.select ? transformPath(path.select, contextPath) : null
  )
} // jsonConditionalOp

function evalJsonConditional (json, contextNode, test, transform, value, select) {
  if (!contextNode) return null

  const wrapped = {
    wrap: contextNode
  }
  const testExpr = `$.wrap[?(${test})]`
  const testResult = evalJsonQuery(wrapped, testExpr)

  if (!testResult.length) return null
  return value || select(json).map(transform)
} // evalJsonConditional

function jsonTransformOp (path, contextPath) {
  return json => evalJsonTransform(
    json,
    evalJsonQuery(json, contextPath),
    path.transform,
    transformPath(path.select, contextPath)
  )
} // jsonConditionalOp

function evalJsonTransform (json, contextNode, transform, select) {
  if (!contextNode) return null

  return select(json).map(transform)
} // evalJsonConditional

function unwrapArray (field) {
  return field.length ? field[0] : null
} // unwrapArray

/// /////////////////////
function flattenJson (json, ...args) {
  const contextPath = args.length === 2 ? args[0] : null
  const paths = args.length === 2 ? args[1] : args[0]

  const queries = transformPaths(paths, contextPath)

  const selections = queries.map(query => query(json))
  const fields = selections.map(field => Array.isArray(field) ? unwrapArray(field) : field)

  return fields
} // flattenJson

module.exports = flattenJson
