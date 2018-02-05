/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')

describe('tymly-auth-auth0-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  // let authService

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
        ],
        config: {
        }
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        // authService = tymlyServices.auth0
        done()
      }
    )
  })

  // it('should retrieve an access token', function (done) {
  //   authService.getEmailFromUserId('auth0|5a157ade1932044615a1c502', function (err, email) {
  //     if (err) {
  //       done(err)
  //     } else {
  //       expect(email).toBe('tymly@xyz.xom')
  //       done()
  //     }
  //   })
  // })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
