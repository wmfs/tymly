/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('Settings tests', function () {
  this.timeout(15000)
  let models

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-users-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        models = tymlyServices.storage.models
        done()
      }
    )
  })

  it('should get settings', function (done) {
    models.tymly_settings.find({
      where: {userId: {equals: 'user1'}}
    })
      .then(result => {
        expect(result[0].userId).to.eql('user1')
        expect(result[0].categoryRelevance).to.eql({user1: ['incidents', 'hr', 'hydrants', 'gazetteer', 'expenses']})
        done()
      })
  })
})
