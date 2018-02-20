const sax = require('sax')

const TEXT = '#text'

class SubTreeCapture {
  constructor(elementName, subTreeCallback) {
    this.elementName = elementName
    this.callback = subTreeCallback

    this.subTrees = []
  } // constructor

  startElement (name) {
    this.capturing ? this.capture(name) : this.shouldCapture(name)
  } // startElement

  endElement (name) {
    if (!this.capturing) {
      return
    }

    if (this.isLastTree) {
      this.callback(this.subTrees.pop())
    } else {
      const tree = this.subTrees.pop()
      const parent = this.subTrees[this.subTrees.length - 1]
      const children = parent[name] ? parent[name] : []
      children.push(tree)
      parent[name] = children
    }
  } // endElement

  text (t) {
    if (!this.capturing) {
      return
    }

    const fullText = this.tree[TEXT] ? this.tree[TEXT] + t : t
    this.tree[TEXT] = fullText
  } // text

  get tree () {
    return this.subTrees[this.subTrees.length - 1]
  } // tree

  get capturing () {
    return this.subTrees.length !== 0
  }

  get isLastTree () {
    return this.subTrees.length === 1
  }

  // ////////////////////////////
  shouldCapture (name) {
    if (name !== this.elementName) {
      return
    }

    this.subTrees.push({})
  } // shouldCapture

  capture () {
    ++this.depth

    this.subTrees.push({})
  } // capture
} // class SubTreeCapture

function xmlSubtreeProcessor (inputStream, elementName, subTreeCallback) {
  return new Promise((resolve, reject) => {
    const parser = sax.createStream(true)

    const capture = new SubTreeCapture(elementName, subTreeCallback)

    parser.on('opentag', node => capture.startElement(node.name))
    parser.on('closetag', name => capture.endElement(name))
    parser.on('text', text => capture.text(text))

    parser.on('error', err => reject(err))
    parser.on('end', () => resolve())

    inputStream.pipe(parser)
  })
} // xmlSubtreeProcessor

module.exports = xmlSubtreeProcessor
