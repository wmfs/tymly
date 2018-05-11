/* eslint-env mocha */

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const process = require('process')

describe('Simple email tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService

  it('should create some basic tymly services to test sending emails', done => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [],
        config: {}
      },
      (err, tymlyServices) => {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        done()
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
