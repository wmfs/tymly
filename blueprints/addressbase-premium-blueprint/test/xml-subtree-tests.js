/* eslint-env mocha */

const chai = require('chai')
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)

const expect = chai.expect
const Readable = require('stream').Readable

const xmlSubtreeProcessor = require('../lib/xml-subtree-processor')

function stream (text) {
  const s = new Readable()
  s.push(text)
  s.push(null)
  return s
} // stream

describe('xml-subtree-processor', () => {
  it('count requested subtrees', async () => {
    let count = 0

    await xmlSubtreeProcessor(
        stream('<root><sub/><ignore/><sub/></root>'),
        'sub',
        () => ++count
    )

    expect(count).to.equal(2)
  })

  it('find subtree regardless of how deeply nested', async () => {
    let count = 0

    await xmlSubtreeProcessor(
      stream('<root><h><h><h><h><h><h><d><d><a><a><y><afs><a><sub/></a></afs></y></a></a></d></d></h><sub/></h></h></h></h></h></root>'),
      'sub',
      () => ++count
    )

    expect(count).to.equal(2)
  })

  it('extract subtree with text', async () => {
    let tree = null

    await xmlSubtreeProcessor(
      stream('<root><sub>Hello</sub></root>'),
      'sub',
      sub => { tree = sub }
    )

    expect(tree).to.exist()
    expect(tree).to.eql({ '#text': 'Hello' })
  })

  it('extract subtree with nested elements', async () => {
    let tree = null

    await xmlSubtreeProcessor(
      stream('<body><p><line>Hello</line><line>World!</line></p></body>'),
      'p',
      sub => { tree = sub }
    )

    expect(tree).to.exist()
    expect(tree).to.eql({
      line: [{ '#text': 'Hello' }, { '#text': 'World!' }]
    })
  })
})
