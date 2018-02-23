/* eslint-env mocha */

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
    // application specific logging, throwing an error, or other logic here
})

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const chaiString = require('chai-string')
chai.use(dirtyChai)
chai.use(chaiString)

const expect = chai.expect
const assert = chai.assert
const Readable = require('stream').Readable

const xmlTransform = require('../lib/xml-transform-to-csv')

const xmlSource = `<items>
<item><title>A painting</title><description>Picasso!</description></item>
<item><title>Some lovely fruit</title><description>Pomelo</description></item>
<item><title>A pair of trousers</title><description>Old man corduroys</description></item>
<price>500</price>
</items>`

function stream (text) {
  const s = new Readable()
  s.push(text)
  s.push(null)
  return s
} // stream

describe('xml-transform-to-csv', () => {
  it('flatten xml', async () => {
    const results = []

    await xmlTransform(
      stream(xmlSource),
      'items',
      '$.item',
      [
        '@.title',
        '$.missing',
        '@.description',
        '$.price'
      ]
    ).each(line => results.push(line))

    expect(results).to.eql([
      'A painting,,Picasso!,500',
      'Some lovely fruit,,Pomelo,500',
      'A pair of trousers,,Old man corduroys,500'
    ])
  })

  it('error propagation', async () => {
    const testFn = () => xmlTransform(
          stream(xmlSource),
          'items',
          '(!!! bad json path!!!)',
      [
        '@.title',
        '$.missing',
        '@.description',
        '$.price'
      ]
      )

    try {
      await testFn()
    } catch (err) {
      expect(err.message).to.equal('EachPromise without an each()')
    }

    try {
      await testFn().each(() => {})
    } catch (err) {
      expect(err.message).to.startsWith('Lexical error')
    }

    try {
      await xmlTransform()
      assert.fail('Expected exception')
    } catch (err) {

    }
  })

  xit('conditional selection', async () => {
    const results = []

    await xmlTransform(
            stream(xmlSource),
            'items',
            '$.item',
      [
        '@.title',
        '$.missing',
        '@.description',
        '(@.description=="Pomelo")',
        '$.price'
      ]
        ).each(line => results.push(line))

    expect(results).to.eql([
      'A painting,,Picasso!,500',
      'Some lovely fruit,,Pomelo,500',
      'A pair of trousers,,Old man corduroys,500'
    ])
  })
})
