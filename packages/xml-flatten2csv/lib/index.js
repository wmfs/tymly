
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const promisify = require('util').promisify

const pexists = promisify(fs.exists)
const pmkdirp = promisify(mkdirp)

const xmlTransformToCsv = require('./xml-transform-to-csv')

function error (message, code, path) {
  const err = new Error(message)
  if (code) err.code = code
  if (path) err.path = path
  return err
} // error


function selectPaths (headerMap) {
  if (!headerMap || headerMap.length === 0) {
    throw error('headerMap must not be empty')
  } // selectPaths

  return headerMap.map(fields => fields[0])
} // headerMap

async function openInputStream (xmlPath) {
  if (!xmlPath) throw error('xmlPath must be set')

  if (!await pexists(xmlPath)) {
    throw error(`File ${xmlPath} not found`, 'ENOENT', xmlPath)
  }

  const source = fs.createReadStream(xmlPath)
  return source
} // openInputStream

async function createOutputStream (csvPath) {
  if (!csvPath) throw error('csvPath must be set')

  const outputDir = path.dirname(csvPath)
  await pmkdirp(outputDir)
  return fs.createWriteStream(csvPath)
} // createOutputStream

function writeLine (outputStream, fields, headerMap) {
  console.log(fields)
} // writeLine

async function xmlFlatten2Csv(options) {
  const selectors = selectPaths(options.headerMap)

  const inputStream = await openInputStream(options.xmlPath)
  const outputStream = await createOutputStream(options.csvPath)

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
