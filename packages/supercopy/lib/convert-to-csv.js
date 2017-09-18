const fs = require('fs')
const path = require('path')
const expat = require('node-expat')

class RecordHandler {
  constructor (triggerElement, outputStream) {
    this.triggerElement = triggerElement
    this.outputStream = outputStream
    this.buffer = ''
    this.capture = false
    this.first = true
    this.nested = false
  }

  startHandler (name) {
    if (name === this.triggerElement) {
      this.capture = true
      this.first = true
    }
    this.buffer = ''
    this.nested = name
  }

  endHandler (name) {
    if (name === this.triggerElement) {
      this.capture = false
      this.outputStream.write('\n')
    }
    if (this.nested !== name){
      return
    }
    if (this.capture) {
      if (!this.first) {
        this.outputStream.write(', ')
      }
      this.outputStream.write(this.buffer)
      this.first = false
    }

  }

  text (data) {
    this.buffer += data
  }
}

class headerGenerator{
  constructor(triggerElement, outputStream){
    this.triggerElement = triggerElement
    this.outputStream = outputStream
    this.capture = false
    this.headers = new Set()
  }

  writeHeaders () {
    for(header in this.headers){
      this.outputStream.write(header + ", ")
    }
  }

  getHeaders (name) {
    if(this.capture === true){
      console.log('Found header', name)
      this.headers.add(name)
    }
    if (name === this.triggerElement){
      this.capture = true
    }
    this.writeHeaders()
  }
}

function createParser(triggerElement, outputStream) {
  const parser = new expat.Parser('UTF-8')

  const handler = new RecordHandler(triggerElement, outputStream)
  parser.on('startElement', name => handler.startHandler(name))
  parser.on('endElement', name => handler.endHandler(name))
  parser.on('text', data => handler.text(data))

  return parser
}

function convertToCsv (triggerElement, xmlFilePath, csvFilePath, callback) {
  const xmlIn = fs.createReadStream(xmlFilePath)
  const csvOut = fs.createWriteStream(csvFilePath)

  // create the parser
  parser = createParser(triggerElement, csvOut)

  xmlIn.pipe(parser)
  parser.on('close', () => {
    csvOut.end()
    callback()
  })
}

module.exports = convertToCsv
convertToCsv.RecordHandler = RecordHandler
convertToCsv.createParser = createParser
convertToCsv.headerGenerator = headerGenerator