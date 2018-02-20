const sax = require('sax')

function xmlSubtreeProcessor (inputStream, elementName, treeCallback) {
  return new Promise((resolve, reject) => {
    const parser = sax.createStream(true)

    parser.on('closetag', node => {
      if (node === elementName) {
        treeCallback()
      }
    })

    parser.on('error', err => reject(err))
    parser.on('end', () => resolve())

    inputStream.pipe(parser)
  })
} // xmlSubtreeProcessor

module.exports = xmlSubtreeProcessor
