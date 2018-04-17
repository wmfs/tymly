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
    this.lang = null
  } // startElement

  attribute (name, value) {
    if (name !== 'xml:lang') {
      return
    }

    this.lang = value
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
    return (this.subTrees.length === 1) ||
      (this.subTrees.length === 2 && this.subTrees[1][LANG])
  } // isLastTree

  // ////////////////////////////
  pushTree () {
    this.subTrees.push({})
    if (this.lang) {
      this.subTrees.push({ [LANG]: this.lang })
      this.lang = null
    }
  } // pushTree

  popTree () {
    if (this.tree[LANG]) {
      const lang = this.tree[LANG]
      delete this.tree[LANG]
      this.hoist(lang)
    }

    return this.subTrees.pop()
  } // popTree

  emitTree () {
    this.callback(this.popTree())
  } // emitTree

  hoist (name) {
    const current = this.popTree()

    const parent = this.tree
    const children = parent[name] ? parent[name] : []
    children.push(current)
    parent[name] = children
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
