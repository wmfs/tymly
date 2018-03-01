
const EachPromise = require('./each-promise')
const xmlSubtreeProcessor = require('./xml-subtree-processor')
const simplifyJson = require('./simplify-json')
const flattenJson = require('./flatten-json')
const jp = require('jsonpath')

function * processPivot (tree, pivotPath, selectPaths) {
  const csv = flattenJson(tree, pivotPath, selectPaths)

  yield (csv)
} // processPivot

function * processPivotArray (tree, pivotPath, count, selectPaths) {
  for (let i = 0; i !== count; ++i) {
    const contextPath = `${pivotPath}[${i}]`

    const csv = flattenJson(tree, contextPath, selectPaths)

    yield (csv)
  }
} // processPivotArray

function * processSteppedArray (tree, pivotPath, selectPaths) {
  const pivotPaths = jp.paths(tree, pivotPath).map(path => jp.stringify(path))

  for (const contextPath of pivotPaths) {
    const csv = flattenJson(tree, contextPath, selectPaths)

    yield (csv)
  }
} // processSteppedArray

function * processSubtree (
  subTree,
  pivotPath,
  selectPaths
) {
  const cleanTree = simplifyJson(subTree)

  const pivots = jp.query(cleanTree, pivotPath)

  if (pivots.length > 1) {
    yield * processSteppedArray(cleanTree, pivotPath, selectPaths)
  } else if (Array.isArray(pivots[0])) {
    yield * processPivotArray(cleanTree, pivotPath, pivots[0].length, selectPaths)
  } else if (pivots[0]) {
    yield * processPivot(cleanTree, pivotPath, selectPaths)
  }
} // processSubtree

function xmlTransformToCsv (
  inputStream,
  elementName,
  pivotPath,
  selectPaths,
  options
) {
  return new EachPromise((each, resolve, reject) => {
    xmlSubtreeProcessor(inputStream, elementName, options)
      .each(subTree => {
        for (const line of processSubtree(subTree, pivotPath, selectPaths)) {
          each(line)
        }
      })
      .then(() => resolve())
      .catch(err => reject(err))
  })
} // xmlTransformToCsv

module.exports = xmlTransformToCsv
