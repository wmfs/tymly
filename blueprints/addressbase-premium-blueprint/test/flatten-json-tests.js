/* eslint-env mocha */

const expect = require('chai').expect

const flattenJson = require('../lib/flatten-json-to-csv')

function buildTests (title, json, pathArray, expectedArray) {
  describe(title, () => {
    for (let i = 1; i <= pathArray.length; ++i) {
      const testPaths = pathArray.slice(0, i)
      const testExpected = expectedArray.slice(0, i).join()

      it(`Extract ${i} field${i - 1 ? 's' : ''}`, () => {
        const actual = flattenJson(json, testPaths)

        expect(actual).to.equal(testExpected)
      })
    }
  })
} // buildTests

describe('flatten-json-to-csv', () => {
  buildTests(
    'simple object',
    {
      title: 'Some lovely fruit',
      description: 'Pomelo',
      price: 500
    },
    [
      '$.title',
      '$.missing',
      '$.description',
      '$.price'
    ],
    [
      'Some lovely fruit',
      '',
      'Pomelo',
      '500'
    ]
  )

  buildTests(
    'nested object',
    {
      item: {
        title: 'Some lovely fruit',
        description: 'Pomelo'
      },
      price: 500
    },
    [
      '$.item.title',
      '$.missing',
      '$.item.description',
      '$.price'
    ],
    [
      'Some lovely fruit',
      '',
      'Pomelo',
      '500'
    ]
  )
})
