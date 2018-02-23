
const EachPromise = require('./each-promise')
const xmlSubtreeProcessor = require('./xml-subtree-processor')
const simplifyJson = require('./simplify-json')
const flattenJson = require('./flatten-json-to-csv')
const jp = require('jsonpath')

function * processSubtree (
  subTree,
  pivotPath,
  selectPaths
) {
  const cleanTree = simplifyJson(subTree)

  const pivots = jp.query(cleanTree, pivotPath)[0]
  for (let i = 0; i !== pivots.length; ++i) {
    const contextPath = `${pivotPath}[${i}]`

    const csv = flattenJson(cleanTree, contextPath, selectPaths)

    yield (csv)
  }
} // processSubtree

function xmlTransformToCsv (
  inputStream,
  elementName,
  pivotPath,
  selectPaths
) {
  return new EachPromise((each, resolve, reject) => {
    xmlSubtreeProcessor(inputStream, elementName)
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
