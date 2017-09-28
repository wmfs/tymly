'use strict'

const fs = require('fs')
const sax = require('sax')
const dottie = require('dottie')
const _ = require('lodash')
var endOfLine = require('os').EOL

module.exports = function (options, callback) {

  

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

  saxStream.on('end', function () { callback(null, {count: count}) })

  source.pipe(saxStream)
}

function writeHeadersToFile (headerMap, outputStream) {
  let headerString = ''
  for (let [idx, header] of headerMap.entries()) {
    if (idx === headerMap.length - 1) { // it's the last entry
      headerString += header[1] + endOfLine
    } else {
      headerString += header[1] + ', '
    }
  }
  outputStream.write(headerString)
}

function writeRecordToFile (record, headerMap, outputStream) {
  let recordString = ''

  for (let [idx, header] of headerMap.entries()) {
    if (_.isObject(record[header[3]])) { // it's a parent node
      if (idx === headerMap.length - 1) { // it's the last entry
        if (record[header[3]].hasOwnProperty(header[0])) { // it contains a value for property
          if (header[2] === 'string') { // it's a string
            recordString += '"' + record[header[3]][header[0]] + '"' + endOfLine
          } else { // it's a number or date
            recordString += record[header[3]][header[0]] + endOfLine
          }
        } else { // it does not contain a value for property
          recordString += endOfLine
        }
      } else { // it is not the last entry
        if (record[header[3]].hasOwnProperty(header[0])) { // it contains a value for property
          if (header[2] === 'string') { // it's a string
            recordString += '"' + record[header[3]][header[0]] + '",'
          } else { // it's number or date
            recordString += record[header[3]][header[0]] + ','
          }
        } else { // it does not contain a value for property
          recordString += ','
        }
      }
    } else {
      if (idx === headerMap.length - 1) { // it's the last entry
        if (record.hasOwnProperty(header[0])) { // it does contain a value for property
          if (header[2] === 'string') { // it's a string
            recordString += '"' + record[header[0]] + '"' + endOfLine
          } else { // it's a number or date
            recordString += record[header[0]] + endOfLine
          }
        } else { // it does not contain a value for property
          recordString += endOfLine
        }
      } else { // it is not the last entry
        if (record.hasOwnProperty(header[0])) { // it does contain a value for property
          if (header[2] === 'string') { // it's a string
            recordString += '"' + record[header[0]] + '",'
          } else { // it's a number or date
            recordString += record[header[0]] + ','
          }
        } else { // it does not contain a value for property
          recordString += ','
        }
      }
    }
  }
  outputStream.write(recordString)
}
