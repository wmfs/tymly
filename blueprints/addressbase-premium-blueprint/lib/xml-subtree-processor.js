const sax = require('sax')

const TEXT = '#text'

class SubTreeCapture {
  constructor(elementName, subTreeCallback) {
    this.elementName = elementName
    this.callback = subTreeCallback

    this.subTrees = []
  } // constructor

  startElement (name) {
    if (this.capturing || this.shouldCapture(name)) {
      this.pushTree()
    }
  } // startElement

  endElement (name) {
    if (!this.capturing) {
      return
    }

    if (this.isLastTree) {
      this.emitTree()
    } else {
      this.hoist(name)
    }
  } // endElement

  text (t) {
    if (!this.capturing) {
      return
    }

    const fullText = this.tree[TEXT] ? this.tree[TEXT] + t : t
    this.tree[TEXT] = fullText
  } // text

  // ////////////////////////////
  get tree () {
    return this.subTrees[this.subTrees.length - 1]
  } // tree

  get capturing () {
    return this.subTrees.length !== 0
  } // capturing

  get isLastTree () {
    return this.subTrees.length === 1
  } // isLastTree

  get parentTree () {
    return this.subTrees[this.subTrees.length - 2]
  } // parentTree

  // ////////////////////////////
  pushTree () {
    this.subTrees.push({})
  } // pushTree

  popTree () {
    return this.subTrees.pop()
  } // popTree

  emitTree () {
    this.callback(this.popTree())
  } // emitTree

  hoist (name) {
    const parent = this.parentTree
    const children = parent[name] ? parent[name] : []
    children.push(this.popTree())
    parent[name] = children
  } // hoist

  shouldCapture (name) {
    return (name === this.elementName)
  } // shouldCapture
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
