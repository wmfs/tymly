'use strict'

const fs = require('fs')
const sax = require('sax')
const dottie = require('dottie')
const _ = require('lodash')
const path = require('path')
const mkdirp = require('mkdirp')
const debug = require('debug')

const endOfLine = require('os').EOL
const comma = ','

module.exports = function (options, callback) {
  const outputPath = path.dirname(options.csvPath)
  mkdirp(outputPath, (err) => {
    if (err) {
      debug(err)
      callback(err)
    } else {
      const source = fs.createReadStream(options.xmlPath)
      const output = fs.createWriteStream(options.csvPath)
      const saxStream = sax.createStream(true)

      saxStream.on('error', function () {
        console.log('ERR')
      })

      let count = 0
      let accepting = false
      let currentObj
      let pathParts = []
      let pathPartsString

      writeHeadersToFile(options.headerMap, output)

      saxStream.on(
        'opentag',
        function (t) {
          if (t.name === options.rootXMLElement) {
            accepting = true
            pathParts = []
            currentObj = {}
          } else {
            if (accepting) {
              pathParts.push(t.name)
              pathPartsString = pathParts.join('.')
            }
          }
        }
      )

      saxStream.on(
        'text',
        function (text) {
          if (accepting) {
            if (text.trim() !== '\n' && text.trim() !== '') {
              dottie.set(currentObj, pathPartsString, text)
            }
          }
        }
      )

      saxStream.on(
        'closetag',
        function (tagName) {
          if (tagName === options.rootXMLElement) {
            writeRecordToFile(currentObj, options.headerMap, output)
            count++
            accepting = false
            currentObj = {}
          } else {
            pathParts.pop()
          }
        }
      )

      saxStream.on('end', function () {
        callback(null, {count: count})
      })

      source.pipe(saxStream)
    }
  })
}

function writeHeadersToFile (headerMap, outputStream) {
  let headerString = ''
  for (let [idx, header] of headerMap.entries()) {
    const separator = (idx === headerMap.length - 1) ? endOfLine : comma
    headerString += header[1] + separator
  }
  outputStream.write(headerString)
}

function writeRecordToFile (record, headerMap, outputStream) {
  let recordString = ''

  for (let [idx, header] of headerMap.entries()) {
    const field = _.isObject(record[header[3]]) ? record[header[3]][header[0]] : record[header[0]]
    const separator = (idx === headerMap.length - 1) ? endOfLine : comma

    recordString += writeField(field, header[2], separator)
  }
  outputStream.write(recordString)
}

function writeField (field, type, separator) {
  if (!field) return separator

  const quote = type === 'string' ? '"' : ''

  return `${quote}${field}${quote}${separator}`
}
