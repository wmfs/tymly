/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('Demo tests', function () {
  this.timeout(5000)
  let models
  let forms

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
        forms = tymlyServices.forms.forms
        done()
      }
    )
  })
  it('should get categories', function (done) {
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
        console.log(result)
        expect(result[0].user_id).to.eql('user1')
        expect(result[0].state_machine_names).to.eql({user1: ['wmfs_claimAnExpense_1_0', 'wmfs_reportHydrantDefect_1_0']})
        done()
      })
  })
  it('should get notifications', function (done) {
    models.tymly_notifications.find('test')
      .then(result => {
        expect(result[0].user_id).to.eql('test')
        expect(result[0].title).to.eql('Employee Info #1')
        expect(result[0].description).to.eql('Expense claim #1')
        expect(result[0].category).to.eql('information')
        expect(result[1].user_id).to.eql('test')
        expect(result[1].title).to.eql('Employee Info #2')
        expect(result[1].description).to.eql('Expense claim #2')
        expect(result[1].category).to.eql('information')
        expect(result[2].user_id).to.eql('test')
        expect(result[2].title).to.eql('Employee Info #3')
        expect(result[2].description).to.eql('Expense claim #3')
        expect(result[2].category).to.eql('information')
        done()
      })
  })
  it('should get the todos', function (done) {
    models.tymly_todos.find('test')
      .then(result => {
        expect(result[0].user_id).to.eql('test')
        expect(result[0].team_name).to.eql('ClaimsTeam')
        expect(result[0].state_machine_title).to.eql('Expenses')
        expect(result[0].state_machine_category).to.eql('hr')
        expect(result[1].user_id).to.eql('test')
        expect(result[1].todo_title).to.eql('Sickness')
        expect(result[1].description).to.eql('Acknowledge Vincent Vega has booked sick Friday 27th October 2017')
        expect(result[2].user_id).to.eql('test')
        expect(result[2].description).to.eql('Walter White is claiming $50 for A large costume')
        done()
      })
  })
  it('should get the watched boards', function (done) {
    models.tymly_watchedBoards.find('test')
      .then(result => {
        expect(result[0].user_id).to.eql('test')
        expect(result[0].feed_name).to.eql('wmfs_incidentSummary_1_0|1234|2017')
        expect(result[0].title).to.eql('Incident 1234/2017')
        expect(result[0].description).to.eql('RTC with 3 casualties and 0 fatalities')
        expect(result[1].user_id).to.eql('test')
        expect(result[1].feed_name).to.eql('wmfs_incidentSummary_1_0|1234|2016')
        expect(result[1].description).to.eql('RTC with 2 casualties and 0 fatalities')
        expect(result[2].user_id).to.eql('test')
        expect(result[2].description).to.eql('RTC with 2 casualties and 0 fatalities')
        done()
      })
  })
  it('should get forms', function (done) {
    expect(forms['tymly_bookSomeoneSick'].jsonSchema.title).to.eql('Book someone sick')
    expect(forms['tymly_claimAnExpense'].jsonSchema.title).to.eql('Claim an expense')
    expect(forms['tymly_createBlankProperty'].jsonSchema.title).to.eql('Create a blank property')
    done()
  })
})
