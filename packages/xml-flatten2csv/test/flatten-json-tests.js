/* eslint-env mocha */

const expect = require('chai').expect

const flattenJson = require('../lib/flatten-json-to-csv')

function buildTests (title, json, ...args) {
  const contextPath = args.length === 3 ? args[0] : null
  const [pathArray, expectedArray] = args.length === 2 ? args : args.slice(1)

  describe(title, () => {
    for (let i = 1; i <= pathArray.length; ++i) {
      const testPaths = pathArray.slice(0, i)
      const testExpected = expectedArray.slice(0, i).join()

      const testArgs = contextPath ? [ contextPath, testPaths ] : [ testPaths ]

      it(`Extract ${i} field${i - 1 ? 's' : ''}`, () => {
        const actual = flattenJson(json, ...testArgs)

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

  buildTests(
    'nested object, set context on a subobject',
    {
      item: {
        title: 'Some lovely fruit',
        description: 'Pomelo'
      },
      price: 500
    },
    '$.item',
    [
      '@.title',
      '$.missing',
      '@.description',
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
    'nested object, set context on one of three subobjects',
    {
      item: [
        {
          title: 'A painting',
          description: 'Picasso!'
        },
        {
          title: 'Some lovely fruit',
          description: 'Pomelo'
        },
        {
          title: 'A pair of trousers',
          description: 'Old man corduroys'
        }
      ],
      price: 500
    },
    '$.item[1]',
    [
      '@.title',
      '$.missing',
      '@.description',
      '$.price'
    ],
    [
      'Some lovely fruit',
      '',
      'Pomelo',
      '500'
    ]
  )

  describe('conditional selection', () => {
    const json = {
      item: [
        {
          title: 'A painting',
          description: 'Picasso!'
        },
        {
          title: 'Some lovely fruit',
          description: 'Pomelo'
        },
        {
          title: 'A pair of trousers',
          smell: 'A bit lagery'
        }
      ],
      price: 500
    }

    for (let i = 0; i !== json.item.length; ++i) {
      const item = json.item[i]
      buildTests(
        `is ${item.title} a citrus?  fixed value output`,
        json,
        `$.item[${i}]`,
        [
          '@.title',
          '@.description',
          {
            test: '@.description=="Pomelo"',
            value: 'one of the four original citrus'
          },
          '$.price'
        ],
        [
          item.title,
          item.description,
          i === 1 ? 'one of the four original citrus' : '',
          500
        ]
      )

      buildTests(
        `is ${json.item[i].title} not a citrus?`,
        json,
        `$.item[${i}]`,
        [
          '@.title',
          '@.description',
          {
            test: '@.description!="Pomelo"',
            value: 'sadly not a citrus'
          },
          '$.price'
        ],
        [
          item.title,
          item.description,
          i === 1 ? '' : 'sadly not a citrus',
          500
        ]
      )
    }

    for (let i = 0; i !== json.item.length; ++i) {
      const item = json.item[i]
      buildTests(
        `test ${item.title} and select`,
        json,
        `$.item[${i}]`,
        [
          '@.title',
          {
            test: '@.title=="Some lovely fruit"',
            select: '@.description'
          },
          '$.price'
        ],
        [
          item.title,
          i === 1 ? item.description : '',
          500
        ]
      )
    }
  })
})
