
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const promisify = require('util').promisify

const eol = require('os').EOL

const pexists = path =>
  new Promise(resolve => fs.access(path, err => resolve(!err)))
const pmkdirp = promisify(mkdirp)

const stringType = 'string'

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
  }

  return headerMap.map(fields => fields[0])
} // selectPaths

function selectHeaders (headerMap) {
  return headerMap.map(fields => fields[1])
} // selectHeaders

function selectTypes (headerMap) {
  return headerMap.map(fields => fields[2])
} // selectTypes

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

function closeOutputStream (outputStream) {
  return new Promise((resolve, reject) =>
    outputStream.end(err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  )
} // closeOutputStream

function writeField(outputStream, field, type) {
  if (!field) return

  const quote = (type === stringType) ? '"' : ''
  outputStream.write(`${quote}${field}${quote}`)
} // writeField

function writeHeaderLine(outputStream, headers) {
  const types = headers.map(() => stringType)
  writeLine(outputStream, headers, types)
} // writeHeaderLine

function writeLine (outputStream, fields, types) {
  outputStream.cork()

  const last = types.length - 1
  for (let i = 0; i !== types.length; ++i) {
    const separator = (i !== last) ? ',' : eol

    writeField(outputStream, fields[i], types[i])

    outputStream.write(separator)
  }

  outputStream.uncork()
} // writeLine

async function xmlFlatten2Csv(options) {
  const selectors = selectPaths(options.headerMap)
  const headers = selectHeaders(options.headerMap)
  const types = selectTypes(options.headerMap)

  const inputStream = await openInputStream(options.xmlPath)
  const outputStream = await createOutputStream(options.csvPath)

  writeHeaderLine(outputStream, headers)

  try {
    await xmlTransformToCsv(
      inputStream,
      options.rootXMLElement,
      options.pivotPath,
      selectors
    )
      .each(fields => writeLine(outputStream, fields, types))
  } finally {
    await closeOutputStream(outputStream)
  }
} // xmlFlatten2csv

module.exports = xmlFlatten2Csv
