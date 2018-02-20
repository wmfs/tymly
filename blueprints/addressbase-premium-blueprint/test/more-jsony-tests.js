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
      line: [{ '#text': 'Hello' }, { strong: { '#text': 'World!' } }]
    }
    const expected = {
      line: [ 'Hello', { strong: 'World!'} ]
    }

    const actual = simplifyJson(xml2json)

    expect(actual).to.eql(expected)
  })

})
