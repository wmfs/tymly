/* eslint-env mocha */

'use strict'

const tymly = require('./../lib')

describe('Shutdown services tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService
  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'

  it('should boot up tymly with some plugins', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-express-plugin')
        ],
        config: {
          auth: {
            secret: secret,
            audience: audience
          }
        }
      },
      function (err, tymlyServices) {
        tymlyService = tymlyServices.tymly
        done(err)
      }
    )
  })

  it('should shut down Tymly and plugins', async () => {
    await tymlyService.shutdown()
  })
})
