const fs = require('fs')
const expat = require('node-expat')

class RecordHandler {
  /**
   * RecordHandler contains a series of methods that detail how to deal with varying parts of an XML document [start tags, end tags, and text content]
   * */

  constructor (triggerElement, outputStream) {
    // Assigns variables for use in functions within the RecordHandler
    this.triggerElement = triggerElement      // Element to start capturing on, so we can avoid capturing meta data etc
    this.outputStream = outputStream      // Location to write to
    this.buffer = ''      // Buffer variable to hold the contents read into the parser
    this.capture = false      // Boolean to control whether the parser should "capture" the next thing to be read
    this.first = true     /// Boolean to note whether this element is the "first" to ensure comma insertion complies with CSV standards
    this.nested = false     /// Var to note whether this element is nested within another element to ensure that unnecessary tags are not added into the CSV output
  }

  // Defines behaviour for "start" elements of XML data, typically the opening tag such as "<objectName>"
  startHandler (name) {
    if (name === this.triggerElement) {
      /**
       * If this start element is the trigger element, make "capture" true, and note that this is the first element in the capture
       */
      this.capture = true
      this.first = true
    }
    // Clear the buffer and make sure the nested var takes in the current tag to check later if it is truly nested
    this.buffer = ''
    this.nested = name
  }

  endHandler (name) {
    // Defines behaviour for "end" elements of XML data, typically the closing tag such as "</objectName>"
    if (name === this.triggerElement) {
      // If this end element is the trigger element, make "capture" false, and start a new line (If we have reached the end of a trigger element we have finished recording this record)
      this.capture = false
      this.outputStream.write('\n')
    }
    if (this.nested !== name) {
      // If $nested is not the same as $name then break out of this condition
      return
    }
    if (this.capture) {
      if (!this.first) {
        // Insert comma before non first captured elements
        this.outputStream.write(',')
      }
      // Write all buffered content into the output stream
      this.outputStream.write(this.buffer)
      this.first = false
    }
  }

  text (data) {
    // Defines behaviour for text elements of XML data, typically between the opening and closing tags
    this.buffer += data
  }
}

class HeaderHandler {
  // Another parser to perform an initial pass to grab the headers for the first row of the CSV output
  constructor (triggerElement, outputStream) {
    this.triggerElement = triggerElement      // Element to start capturing on, so we can avoid capturing meta data etc
    this.outputStream = outputStream      // Location to write to
    this.complete = false     // Boolean to state whether or not we are done recording the headers
    this.first = true     // Boolean to state whether or not this is the first element to maintain comma behaviour
    this.capture = false      // Boolean to state whether or not to "capture" the coming content
  }

  startHandler (name) {
    // On open tags, if this is the $triggerElement then start capturing AFTER it
    if (name === this.triggerElement) {
      this.capture = true
    }
    // Record this tag as nested to check for nested tags
    this.nested = name
  }

  endHandler (name) {
    // If complete break out of this process
    if (this.complete) {
      return
    }
    // If this end element is $triggerElement then stop capturing, make complete true, and jump to a new line in preparation for records to be inserted
    if (name === this.triggerElement) {
      this.capture = false
      this.complete = true
      this.outputStream.write('\n')
    }
    // If we are nested break out
    if (this.nested !== name) {
      return
    }
    // If we're not first, add a comma before
    if (this.capture) {
      if (!this.first) {
        this.outputStream.write(',')
      }
      // Write to output stream and state this is no longer the first element
      this.outputStream.write(name)
      this.first = false
    }
  }
}

function createParser (triggerElement, outputStream) {
  // Constructor for content Parser for use in implementation
  const parser = new expat.Parser('UTF-8')

  const handler = new RecordHandler(triggerElement, outputStream)
  // Assign functions for this parser
  parser.on('startElement', name => handler.startHandler(name))
  parser.on('endElement', name => handler.endHandler(name))
  parser.on('text', data => handler.text(data))

  return parser
}

function getHeaders (triggerElement, outputStream) {
  // Constructor for header Parser for use in implementation
  const parser = new expat.Parser('UTF-8')

  const handler = new HeaderHandler(triggerElement, outputStream)
  // Assign functions for this Parser
  parser.on('startElement', name => handler.startHandler(name))
  parser.on('endElement', name => handler.endHandler(name))

  return parser
}

function readXmlHeader (triggerElement, xmlFilePath, csvOut, callback) {
  // Initiates all necessary params and constructors for getting headers
  const xmlIn = fs.createReadStream(xmlFilePath)

  const headerParser = getHeaders(triggerElement, csvOut)

  xmlIn.pipe(headerParser)
  headerParser.on('close', () => {
    callback()
  })
}

function parseXmlFile (triggerElement, xmlFilePath, csvOut, callback) {
  // Initiates all necessary params and constructors for getting text content
  const xmlIn = fs.createReadStream(xmlFilePath)

  const contentParser = createParser(triggerElement, csvOut)

  xmlIn.pipe(contentParser)
  contentParser.on('close', () => {
    callback()
  })
}

function convertToCsv (triggerElement, xmlFilePath, csvFilePath, callback) {
  // "Main" function for converting from XML file to CSV file
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
