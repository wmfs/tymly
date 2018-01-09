/* eslint-env mocha */

const tymly = require('./../lib')
const path = require('path')
const expect = require('chai').expect

describe('Category tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let categoryService

  it('should load the cat blueprint (which has some registry keys)', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
        ],

        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        categoryService = tymlyServices.categories
        done()
      }
    )
  })

  it('should find the tags are all stored correctly', function () {
    expect(categoryService.categories.cat).to.eql(
      {
        category: 'cat',
        label: 'Cat',
        styling: {
          'background-color': '#5F5F5F'
        }
      }
    )

    expect(categoryService.categories.pet).to.eql(
      {
        category: 'pet',
        label: 'Pet',
        styling: {
          'background-color': '#80C342'
        }
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
