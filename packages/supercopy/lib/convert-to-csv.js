const fs = require('fs')
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
    if (this.nested !== name) {
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

class HeaderHandler {
  constructor (triggerElement, outputStream) {
    this.triggerElement = triggerElement
    this.outputStream = outputStream
    this.complete = false
    this.first = true
    this.capture = false
  }

  startHandler (name) {
    if (name === this.triggerElement) {
      this.capture = true
    }
    this.nested = name
  }

  endHandler (name) {
    if (this.complete) {
      return
    }
    if (name === this.triggerElement) {
      this.capture = false
      this.complete = true
      this.outputStream.write('\n')
    }
    if (this.nested !== name) {
      return
    }
    if (this.capture) {
      if (!this.first) {
        this.outputStream.write(', ')
      }
      this.outputStream.write(name)
      this.first = false
    }
  }
}

function createParser (triggerElement, outputStream) {
  const parser = new expat.Parser('UTF-8')

  const handler = new RecordHandler(triggerElement, outputStream)
  parser.on('startElement', name => handler.startHandler(name))
  parser.on('endElement', name => handler.endHandler(name))
  parser.on('text', data => handler.text(data))

  return parser
}

function getHeaders (triggerElement, outputStream) {
  const parser = new expat.Parser('UTF-8')

  const handler = new HeaderHandler(triggerElement, outputStream)
  parser.on('startElement', name => handler.startHandler(name))
  parser.on('endElement', name => handler.endHandler(name))

  return parser
}

function readXmlHeader (triggerElement, xmlFilePath, csvOut, callback) {
  const xmlIn = fs.createReadStream(xmlFilePath)

  const headerParser = getHeaders(triggerElement, csvOut)

  xmlIn.pipe(headerParser)
  headerParser.on('close', () => {
    callback()
  })
}

function parseXmlFile (triggerElement, xmlFilePath, csvOut, callback) {
  const xmlIn = fs.createReadStream(xmlFilePath)

  const contentParser = createParser(triggerElement, csvOut)

  xmlIn.pipe(contentParser)
  contentParser.on('close', () => {
    callback()
  })
}

function convertToCsv (triggerElement, xmlFilePath, csvFilePath, callback) {
  const csvOut = fs.createWriteStream(csvFilePath)

  readXmlHeader(triggerElement, xmlFilePath, csvOut, () => {
    parseXmlFile(triggerElement, xmlFilePath, csvOut, () => {
      csvOut.end()
      callback()
    })
  })
}

module.exports = convertToCsv
convertToCsv.RecordHandler = RecordHandler
convertToCsv.createParser = createParser
convertToCsv.getHeaders = getHeaders
