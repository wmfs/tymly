const sax = require('sax')
const EachPromise = require('./each-promise')

const TEXT = '#text'
const LANG = '#lang'

const STRIP = 'strip'
const WRAP = 'wrap'

function namespaceProcessor (option) {
  if (!option) return n => n // do nothing
  if (option === STRIP) return n => n.substring(n.indexOf(':') + 1)
  return n => n.replace(':', option)
} // namespaceProcessor

class SubTreeCapture {
  constructor (elementName, options, subTreeCallback) {
    this.elementName = elementName
    this.callback = subTreeCallback

    this.namespaceHandler = namespaceProcessor(options.namespace)
    this.langWrap = (options.xmllang === WRAP)

    this.subTrees = []
  } // constructor

  startElement (nsname) {
    const name = this.namespaceHandler(nsname)
    if (this.capturing || this.shouldCapture(name)) {
      this.pushTree()
    }
  } // startElement

  attribute (name, value) {
    if (!this.capturing) {
      return
    }
    if (name !== 'xml:lang') {
      return
    }

    this.pushTree()
    this.tree[LANG] = value
  }

  endElement (nsname) {
    if (!this.capturing) {
      return
    }

    if (this.isLastTree) {
      this.emitTree()
    } else {
      const name = this.namespaceHandler(nsname)
      this.hoist(name)
    }
  } // endElement

  text (t) {
    if (!this.capturing) {
      return
    }

    if (!t.trim().length) {
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

    if (parent[LANG]) {
      const lang = parent[LANG]
      delete parent[LANG]
      this.hoist(lang)
    }
  } // hoist

  shouldCapture (name) {
    return (name === this.elementName)
  } // shouldCapture
} // class SubTreeCapture

function xmlSubtreeProcessor (inputStream, elementName, options = { }) {
  return new EachPromise((each, resolve, reject) => {
    const parser = sax.createStream(true)

    const capture = new SubTreeCapture(elementName, options, each)

    parser.on('opentag', node => capture.startElement(node.name))
    if (capture.langWrap) {
      parser.on('attribute', attr => capture.attribute(attr.name, attr.value))
    }
    parser.on('closetag', name => capture.endElement(name))
    parser.on('text', text => capture.text(text))

    parser.on('error', err => reject(err))
    parser.on('end', () => resolve())

    inputStream.pipe(parser)
  })
} // xmlSubtreeProcessor

module.exports = xmlSubtreeProcessor
