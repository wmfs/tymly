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

const linearXmlSource = `<items>
<item><title>A painting</title><description>Picasso!</description></item>
<item><title>Some lovely fruit</title><description>Pomelo</description></item>
<item><title>A pair of trousers</title><description>Old man corduroys</description></item>
<price>500</price>
</items>`

const steppedXmlSource = `<wrap>
<items>
  <item><title>A painting</title><description>Picasso!</description></item>
  <price>500</price>
</items>
<items>
  <item><title>Some lovely fruit</title><description>Pomelo</description></item>
  <price>500</price>
</items>
<items>
  <item><title>A pair of trousers</title><description>Old man corduroys</description></item>
  <price>500</price>
</items>
</wrap>`

function stream (text) {
  const s = new Readable()
  s.push(text)
  s.push(null)
  return s
} // stream

for (const [title, source] of [['linear', linearXmlSource], ['stepped', steppedXmlSource]]) {
  describe(`${title} xml-transform-to-csv`, () => {
    it('flatten xml', async () => {
      const results = []

      await xmlTransform(
        stream(source),
        'items',
        '$.item',
        [
          '@.title',
          '$.missing',
          '@.description',
          '$.price'
        ]
      ).each(fields => results.push(fields.join()))

      expect(results).to.eql([
        'A painting,,Picasso!,500',
        'Some lovely fruit,,Pomelo,500',
        'A pair of trousers,,Old man corduroys,500'
      ])
    })

    it('error propagation', async () => {
      const testFn = () => xmlTransform(
        stream(source),
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
        await testFn().each(() => {
        })
      } catch (err) {
        expect(err.message).to.startWith('Lexical error')
      }

      try {
        await xmlTransform()
        assert.fail('Expected exception')
      } catch (err) {

      }
    })

    it('conditional selection', async () => {
      const results = []

      await xmlTransform(
        stream(source),
        'items',
        '$.item',
        [
          '@.title',
          '$.missing',
          '@.description',
          {test: '@.description=="Pomelo"', value: 'LOVE IT'},
          '$.price'
        ]
      ).each(fields => results.push(fields.join()))

      expect(results).to.eql([
        'A painting,,Picasso!,,500',
        'Some lovely fruit,,Pomelo,LOVE IT,500',
        'A pair of trousers,,Old man corduroys,,500'
      ])
    })
  })
}
