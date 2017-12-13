/* eslint-env mocha */

'use strict'

const chai = require('chai')
const chaiSubset = require('chai-subset')
const expect = require('chai').expect
const path = require('path')
const tymly = require('tymly')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

chai.use(chaiSubset)

describe('Demo tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let models, forms, boards, categories, client

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin'),
          require.resolve('tymly-users-plugin'),
          require.resolve('tymly-express-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        models = tymlyServices.storage.models
        forms = tymlyServices.forms.forms
        boards = tymlyServices.boards.boards
        categories = tymlyServices.categories.categories
        client = tymlyServices.storage.client
        done(err)
      }
    )
  })

  it('should get boards', function (done) {
    expect(boards['tymly_expense'].category).to.eql('expenses')
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
        expect(result[0]).to.containSubset({
          userId: 'user1',
          stateMachineNames: {
            favouriteStartableNames: [
              'wmfs_claimAnExpense_1_0',
              'wmfs_reportHydrantDefect_1_0'
            ]
          }
        })
        done()
      })
      .catch(error => {
        done(error)
      })
  })

  it('should get notifications', function (done) {
    models.tymly_notifications.find({where: {userId: {equals: 'test'}}})
      .then(result => {
        expect(result.length).to.eql(3)
        expect(result[0]).to.containSubset({
          userId: 'test',
          title: 'Employee Info #1',
          description: 'Expense claim #1',
          category: 'information'
        })
        expect(result[1]).to.containSubset({
          userId: 'test',
          title: 'Employee Info #2',
          description: 'Expense claim #2',
          category: 'information'
        })
        expect(result[2]).to.containSubset({
          userId: 'test',
          title: 'Employee Info #3',
          description: 'Expense claim #3',
          category: 'information'
        })
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
        expect(result[0]).to.containSubset({
          userId: 'user1',
          categoryRelevance: {
            user1: [
              'incidents',
              'hr',
              'hydrants',
              'gazetteer'
            ]
          }
        })
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
        expect(result[0]).to.containSubset({
          id: 'f91ce050-d437-11e7-88a9-67d19ee5a8b8',
          title: 'Systems Development',
          description: 'The ICT Systems Development Team at West Midlands Fire Service',
          style: {
            icon: 'computer',
            backgroundColor: '#000000'
          }
        })
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
        expect(result[0]).to.containSubset({
          id: 'cdc24f5c-d438-11e7-a2f1-8f832400600b',
          userId: 'test',
          teamName: 'ClaimsTeam',
          stateMachineTitle: 'Expenses',
          stateMachineCategory: 'hr',
          todoTitle: 'Claim1',
          description: 'Walter White is claiming $35 for A large plastic container',
          requiredHumanInput: {},
          launches: {}
        })
        expect(result[1]).to.containSubset({
          id: 'cdc31338-d438-11e7-a2f2-97f8c49032e9',
          userId: 'test',
          teamName: 'ITTeam',
          stateMachineTitle: 'Sickness',
          stateMachineCategory: 'hr',
          todoTitle: 'Sickness',
          description: 'Acknowledge Vincent Vega has booked sick Friday 27th October 2017',
          requiredHumanInput: {},
          launches: {}
        })
        expect(result[2]).to.containSubset({
          id: 'cdc33a5c-d438-11e7-a2f3-5bb79decfe12',
          userId: 'test',
          teamName: 'ClaimsTeam',
          stateMachineTitle: 'Expenses',
          stateMachineCategory: 'hr',
          todoTitle: 'Claim2',
          description: 'Walter White is claiming $50 for A large costume',
          requiredHumanInput: {},
          launches: {}
        })
        done()
      })
      .catch(error => {
        done(error)
      })
  })

  it('should get the watched boards', function (done) {
    models.tymly_watchedBoards.find({where: {userId: {equals: 'test'}}})
      .then(result => {
        expect(result.length).to.eql(4)
        expect(result[0].feedName).to.eql('wmfs_incidentSummary_1_0|1234|2017')
        expect(result[1].feedName).to.eql('wmfs_incidentSummary_1_0|1234|2016')
        expect(result[2].feedName).to.eql('wmfs_incidentSummary_1_0|1234|2015')
        expect(result[3].feedName).to.eql('wmfs_propertyViewer_1_0|4')
        done()
      })
      .catch(error => {
        done(error)
      })
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./scripts/cleanup.sql', client)
  })
})
