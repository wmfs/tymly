const xmlTransformToCsv = require('./xml-transform-to-csv')

function selectPaths (headerMap) { }

function openInputStream (xmlPath) { }
function createOutputStream (csvPath) { }

function writeLine (outputFields, fields, headerMap) { }

async function xmlFlatten2Csv(options) {
  const selectors = selectPaths(options.headerMap)

  const inputStream = openInputStream(options.xmlPath)
  const outputStream = createOutputStream(options.csvPath)

  try {
    xmlTransformToCsv(
      inputStream,
      options.rootXMLElement,
      options.pivotPath,
      selectors
    ).each(fields => writeLine(outputStream, fields, options.headerMap))
  } finally {
    outputStream.close()
  }
} // xmlFlatten2csv

module.exports = xmlFlatten2Csv
