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
  let boards
  let categories

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin'),
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
        boards = tymlyServices.boards.boards
        categories = tymlyServices.categories.categories
        done()
      }
    )
  })

  it('should get boards', function (done) {
    expect(boards['tymly_expense'].boardTitleTemplate).to.eql('Dashboard')
    done()
  })

  it('should get categories', function (done) {
    expect(categories.expenses.label).to.eql('Expenses')
    expect(categories.gazetteer.label).to.eql('Gazetteer')
    expect(categories.fireSafety.label).to.eql('Fire Safety')
    expect(categories.defectiveHydrants.label).to.eql('Defective hydrants')
    expect(categories.fires.label).to.eql('Fire')
    expect(categories.hr.label).to.eql('Human Resources')
    expect(categories.incidents.label).to.eql('Incidents')
    expect(categories.rtcs.label).to.eql('RTC')
    expect(categories.water.label).to.eql('Water')
    expect(categories.workingHydrants.label).to.eql('Working hydrants')
    done()
  })

  it('should get forms', function (done) {
    expect(forms['tymly_bookSomeoneSick'].jsonSchema.title).to.eql('Book someone sick')
    expect(forms['tymly_claimAnExpense'].jsonSchema.title).to.eql('Claim an expense')
    expect(forms['tymly_createBlankProperty'].jsonSchema.title).to.eql('Create a blank property')
    done()
  })

  it('should get favouring startable state machines', function (done) {
    models.tymly_favouringStartableStateMachines.find({where: {userId: {equals: 'user1'}}})
      .then(result => {
        expect(result.length).to.eql(1)
        expect(result[0]).to.have.ownProperty('userId').and.equals('user1')
        expect(result[0]).to.have.ownProperty('stateMachineNames')
        expect(result[0].stateMachineNames).to.have.ownProperty('favouriteStartableNames')
        expect(result[0].stateMachineNames.favouriteStartableNames).to.eql(['wmfs_claimAnExpense_1_0', 'wmfs_reportHydrantDefect_1_0'])
        done()
      })
      .catch(error => {
        done(error)
      })
  })

  it('should get notifications', function (done) {
    models.tymly_notifications.find({where: {userId: {equals: 'test'}}})
      .then(result => {
        expect(result[0].userId).to.eql('test')
        expect(result[0].title).to.eql('Employee Info #1')
        expect(result[0].description).to.eql('Expense claim #1')
        expect(result[0].category).to.eql('information')
        expect(result[1].userId).to.eql('test')
        expect(result[1].title).to.eql('Employee Info #2')
        expect(result[1].description).to.eql('Expense claim #2')
        expect(result[1].category).to.eql('information')
        expect(result[2].userId).to.eql('test')
        expect(result[2].title).to.eql('Employee Info #3')
        expect(result[2].description).to.eql('Expense claim #3')
        expect(result[2].category).to.eql('information')
        done()
      })
      .catch(error => {
        done(error)
      })
  })

  it('should get settings', function (done) {
    models.tymly_settings.find({where: {userId: {equals: 'user1'}}})
      .then(result => {
        expect(result.length).to.eql(1)
        expect(result[0].userId).to.eql('user1')
        expect(result[0].categoryRelevance).to.eql({user1: ['incidents', 'hr', 'hydrants', 'gazetteer']})
        done()
      })
      .catch(error => {
        done(error)
      })
  })

  it('should get teams', function (done) {
    models.tymly_teams.find({where: {title: {equals: 'Systems Development'}}})
      .then(result => {
        expect(result.length).to.eql(1)
        expect(result[0].title).to.eql('Systems Development')
        expect(result[0].description).to.eql('The ICT Systems Development Team at West Midlands Fire Service')
        expect(result[0].style).to.eql({'icon': 'computer', 'backgroundColor': '#000000'})
        done()
      })
      .catch(error => {
        done(error)
      })
  })

  it('should get the todos', function (done) {
    models.tymly_todos.find({where: {userId: {equals: 'test'}}})
      .then(result => {
        expect(result.length).to.eql(3)
        expect(result[0].userId).to.eql('test')
        expect(result[0].teamName).to.eql('ClaimsTeam')
        expect(result[0].stateMachineTitle).to.eql('Expenses')
        expect(result[0].stateMachineCategory).to.eql('hr')
        expect(result[1].userId).to.eql('test')
        expect(result[1].todoTitle).to.eql('Sickness')
        expect(result[1].description).to.eql('Acknowledge Vincent Vega has booked sick Friday 27th October 2017')
        expect(result[2].userId).to.eql('test')
        expect(result[2].description).to.eql('Walter White is claiming $50 for A large costume')
        done()
      })
      .catch(error => {
        done(error)
      })
  })

  it('should get the watched boards', function (done) {
    models.tymly_watchedBoards.find({where: {userId: {equals: 'test'}}})
      .then(result => {
        expect(result.length).to.eql(3)
        expect(result[0].userId).to.eql('test')
        expect(result[0].feedName).to.eql('wmfs_incidentSummary_1_0|1234|2017')
        expect(result[0].title).to.eql('Incident 1234/2017')
        expect(result[0].description).to.eql('RTC with 3 casualties and 0 fatalities')
        expect(result[1].userId).to.eql('test')
        expect(result[1].feedName).to.eql('wmfs_incidentSummary_1_0|1234|2016')
        expect(result[1].description).to.eql('RTC with 2 casualties and 0 fatalities')
        expect(result[2].userId).to.eql('test')
        expect(result[2].description).to.eql('RTC with 2 casualties and 0 fatalities')
        done()
      })
      .catch(error => {
        done(error)
      })
  })
})
