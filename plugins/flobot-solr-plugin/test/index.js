/* eslint-env mocha */

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
// const debug = require('debug')('flobot-solr-plugin')

describe('Simple solr tests', function () {
  let solrService
  it('should create some basic flobot services', function (done) {
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
        solrService = flobotServices.solr
        expect(solrService).to.not.eql(null)
        done()
      }
    )
  })
})
