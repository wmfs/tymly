/* eslint-env mocha */

'use strict'

const tymly = require('./../lib')
const path = require('path')

describe.only('Shutdown services tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService

  it('should boot up tymly with some plugins', (done) => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/test-services-plugin')
        ]
      },
      (err, tymlyServices) => {
        tymlyService = tymlyServices.tymly
        done(err)
      }
    )
  })

  it('should shut down Tymly and plugins', async () => {
    await tymlyService.shutdown()
  })
})
