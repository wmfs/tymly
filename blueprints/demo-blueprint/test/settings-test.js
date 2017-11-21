/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('Demo tests', function () {
  this.timeout(55000)
  let models
  // let forms

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin'),
          // require.resolve('tymly-forms-plugin'),
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
        // forms = tymlyServices.forms.forms
        done()
      }
    )
  })

  it('should get categories', function (done) {
    // console.log(models.tymly_settings)
    models.tymly_settings.find('test-user-2')
      .then(result => {
        console.log('>>>>>>> ' + result[0])
        expect(result[0].userId).to.eql('test-user-2')
        done()
      })
  })
})
