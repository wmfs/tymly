/* eslint-env mocha */

const chai = require('chai')
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)

const expect = chai.expect
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
})
