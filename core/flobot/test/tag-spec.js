/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect

describe('Tag tests', function () {
  const flobot = require('./../lib')

  this.timeout(5000)

  let tagsService

  it('should load the cat blueprint (which has some registry keys)', function (done) {
    flobot.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
        ],

        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        ]
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        tagsService = flobotServices.tags
        done()
      }
    )
  })

  it('should find the tags are all stored correctly', function () {
    expect(tagsService.tags.cat).to.eql(
      {
        tag: 'cat',
        label: 'Cat',
        styling: {
          'background-color': '#5F5F5F'
        }
      }
    )

    expect(tagsService.tags.pet).to.eql(
      {
        tag: 'pet',
        label: 'Pet',
        styling: {
          'background-color': '#80C342'
        }
      }
    )
  })
})
