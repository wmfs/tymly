/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('Demo tests', function () {
  this.timeout(15000)
  let models
  let forms

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
        forms = tymlyServices.forms.forms
        done()
      }
    )
  })
  it('should get categories', function (done) {
    console.log(models.tymly_categories)
    models.tymly_categories.find('Expenses')
      .then(result => {
        expect(result[0].label).to.eql('Expenses')
        expect(result[0].description).to.eql('Things to do with claiming and authorising expenses')
        expect(result[0].style).to.eql({'icon': 'coin', 'backgroundColor': '#00GG00'})
        done()
      })
  })
  it('should get favourites', function (done) {
    models.tymly_favouringStartableStateMachines.find('user1')
      .then(result => {
        expect(result[0].userId).to.eql('user1')
        expect(result[0].stateMachineNames).to.eql({user1: ['wmfs_claimAnExpense_1_0', 'wmfs_reportHydrantDefect_1_0']})
        done()
      })
  })
  it('should get forms', function (done) {
    expect(forms['tymly_wmfsBookSomeoneSick10'].jsonSchema.title).to.eql('Book someone sick')
    expect(forms['tymly_wmfsClaimAnExpense10'].jsonSchema.title).to.eql('Claim an expense')
    expect(forms['tymly_wmfsCreateBlankProperty10'].jsonSchema.title).to.eql('Create a blank property')
    done()
  })
})
