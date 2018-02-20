/* eslint-env mocha */

const expect = require('chai').expect
const Readable = require('stream').Readable

const xmlSubtreeProcessor = require('../lib/xml-subtree-processor')

function stream (text) {
  const s = new Readable()
  s.push(text)
  s.push(null)
  return s
} // stream

describe('xml-subtree-processor', () => {
  it('parse doc and hand back subtrees', async () => {
    let count = 0

    await xmlSubtreeProcessor(
        stream('<root><sub/><ignore/><sub/></root>'),
        'sub',
        () => ++count
    )

    expect(count).to.equal(2)
  })
})