/* eslint-env mocha */

const path = require('path')
const tymly = require('tymly')

describe('Addressbase premium tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService

  it('start tymly', done => {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './..')
        ]
      },
      (err, tymlyServices) => {
        if (err) {
          return done(err)
        }

        tymlyService = tymlyServices.tymly
        done()
      }
    ) // boot
  })

  it('stop Tymly', () => {
    return tymlyService.shutdown()
  })
})
