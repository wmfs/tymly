/* eslint-env mocha */

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')

describe('Simple solr tests', function () {
  // let flobotsService
  it('should create some basic flobot services to test sending emails', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
        ],
        config: {
        }
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        // flobotsService = flobotServices.flobots
        done()
      }
    )
  })
})
