/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect

describe('Registry tests', function () {
  const flobot = require('./../lib')

  this.timeout(5000)

  let registryService

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
        registryService = flobotServices.registry
        done()
      }
    )
  })

  it('should find the value is correctly set in the registry', function () {
    expect(registryService.registry.fbotTest_mealThreshold.value).to.eql(3)
  })
})
