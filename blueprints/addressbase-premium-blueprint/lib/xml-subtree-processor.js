const sax = require('sax')

const TEXT = '#text'

class SubTreeCapture {
  constructor(elementName, subTreeCallback) {
    this.elementName = elementName
    this.callback = subTreeCallback

    this.depth = 0
  } // constructor

  startElement (name) {
    this.depth ? this.capture(name) : this.shouldCapture(name)
  } // startElement

  endElement () {
    if (!this.depth) {
      return
    }

    --this.depth

    if (this.depth !== 0) {
      return
    }

    this.callback(this.subTrees[0])
  } // endElement

  text (t) {
    if (!this.depth) {
      return
    }

    const fullText = this.tree[TEXT] ? this.tree[TEXT] + t : t
    this.tree[TEXT] = fullText
  } // text

  get tree() {
    return this.subTrees[this.subTrees.length-1]
  } // tree

  // ////////////////////////////
  shouldCapture (name) {
    if (name !== this.elementName) {
      return
    }

    this.subTrees = [ { } ]
    this.depth = 1
  } // shouldCapture

  capture (name) {

  } // capture
} // class SubTreeCapture

function xmlSubtreeProcessor (inputStream, elementName, subTreeCallback) {
  return new Promise((resolve, reject) => {
    const parser = sax.createStream(true)

    const capture = new SubTreeCapture(elementName, subTreeCallback)

    parser.on('opentag', node => capture.startElement(node.name))
    parser.on('closetag', () => capture.endElement())
    parser.on('text', text => capture.text(text))

    parser.on('error', err => reject(err))
    parser.on('end', () => resolve())

    inputStream.pipe(parser)
  })
} // xmlSubtreeProcessor

module.exports = xmlSubtreeProcessor
