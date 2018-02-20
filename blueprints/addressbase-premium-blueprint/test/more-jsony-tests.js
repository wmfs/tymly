/* eslint-env mocha */

const expect = require('chai').expect

const simplifyJson = require('../lib/simplify-json')

describe('make more jsony', () => {
  it('simple xml2json example', () => {
    const xml2json = {
      line: [{ '#text': 'Hello' }, { '#text': 'World!' }]
    }
    const expected = {
      line: [ 'Hello', 'World!' ]
    }

    const actual = simplifyJson(xml2json)

    expect(actual).to.eql(expected)
  })

  it('nested xml2json example', () => {
    const xml2json = {
      line: [
        { p: { '#text': 'Hello' } },
        { p: { strong: { '#text': 'World!' } } },
        { p: { '#text': 'All hail Brian Kernighan' } }
      ]
    }
    const expected = {
      line: [
        { p: 'Hello' },
        { p: { strong: 'World!' } },
        { p: 'All hail Brian Kernighan' }
      ]
    }

    const actual = simplifyJson(xml2json)

    expect(actual).to.eql(expected)
  })

  it('fancier xml2json example', () => {
    const xml2json = {
      item: [
        {
          title: [{ "#text": "A painting" }],
          description: [{ "#text": "Picasso!" }]
        },
        {
          title: [{ "#text": "Some lovely fruit" }],
          description: [{ "#text": "Pomelo" }]
        },
        {
          title: [{ "#text": "A pair of trousers" }],
          description: [{ "#text": "Old man corduroys" }]
        }
      ],
      price: [{ "#text": "500" }]
    }
    const expected = {
      item: [
        {
          title: "A painting",
          description: "Picasso!"
        },
        {
          title: "Some lovely fruit",
          description: "Pomelo"
        },
        {
          title: "A pair of trousers",
          description: "Old man corduroys"
        }
      ],
      price: "500"
    }

    const actual = simplifyJson(xml2json)

    expect(actual).to.eql(expected)
  })
})
