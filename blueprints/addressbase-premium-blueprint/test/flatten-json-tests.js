/* eslint-env mocha */

const expect = require('chai').expect

const flattenJson = require('../lib/flatten-json-to-csv')

describe('flatten-json-to-csv', () => {
  describe('simple object', () => {
    const json = {
      title: 'Some lovely fruit',
      description: 'Pomelo',
      price: 500
    }

    const paths = [
      '$.title',
      '$.missing',
      '$.description',
      '$.price'
    ]

    const expected = [
      'Some lovely fruit',
      '',
      'Pomelo',
      '500'
    ]

    for (let i = 1; i <= paths.length; ++i) {
      const testPaths = paths.slice(0, i)
      const testExpected = expected.slice(0, i).join()

      it(`Extract ${i} field${i-1 ? 's' : ''}`, () => {
        const actual = flattenJson(json, testPaths)

        expect(actual).to.equal(testExpected)
      })
    }
  })
})
