
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
} // processPivot

function * processSubtree (
  subTree,
  pivotPath,
  selectPaths
) {
  const cleanTree = simplifyJson(subTree)

  const pivots = jp.query(cleanTree, pivotPath)[0]

  if (Array.isArray(pivots)) {
    yield * processPivotArray(cleanTree, pivotPath, pivots.length, selectPaths)
  } else if (pivots) {
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
