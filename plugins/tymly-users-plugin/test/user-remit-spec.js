/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const HlPgClient = require('hl-pg-client')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_USER_REMIT_STATE_MACHINE = 'tymly_getUserRemit_1_0'

describe('user-remit tymly-users-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox, tymlyService

  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './../test/fixtures/test-blueprint')
        ],
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        tymlyService = tymlyServices.tymly
        done()
      }
    )
  })

  it('should create the settings test resources', function () {
    return sqlScriptRunner('./db-scripts/settings/setup.sql', client)
  })

  it('should create the favourites test resources', function () {
    return sqlScriptRunner('./db-scripts/favourites/setup.sql', client)
  })

  it('should create the remit test resources', function () {
    return sqlScriptRunner('./db-scripts/remit/setup.sql', client)
  })

  it('should start the state machine to get user remit, should get whole remit because client doesn\'t contain anything', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: [],
          categoryNames: [],
          teamNames: [],
          todoExecutionNames: [],
          formNames: [],
          startable: []
        }
      },
      GET_USER_REMIT_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          // console.log(JSON.stringify(executionDescription, null, 2))
          expect(executionDescription.currentStateName).to.eql('GetUserRemit')
          expect(executionDescription.currentResource).to.eql('module:getUserRemit')
          expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')

          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.length).to.eql(5)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('gazetteer')).to.eql(true)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('hr')).to.eql(true)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('hydrants')).to.eql(true)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('incidents')).to.eql(true)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('expenses')).to.eql(true)

          expect(executionDescription.ctx.userRemit.favouriteStartableNames.length).to.eql(2)
          expect(executionDescription.ctx.userRemit.favouriteStartableNames.includes('notifications')).to.eql(true)
          expect(executionDescription.ctx.userRemit.favouriteStartableNames.includes('settings')).to.eql(true)

          expect(Object.keys(executionDescription.ctx.userRemit.add.categories).length).to.eql(3)
          expect(Object.keys(executionDescription.ctx.userRemit.add.categories).includes('Fire')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.categories).includes('Gazetteer')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.categories).includes('Water')).to.eql(true)

          expect(Object.keys(executionDescription.ctx.userRemit.add.todos).length).to.eql(4)
          expect(Object.keys(executionDescription.ctx.userRemit.add.todos)
            .includes('a69c0ac9-cde5-11e7-abc4-cec278b6b50a')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.todos)
            .includes('a69c0ae8-cde5-11e7-abc4-cec278b6b50a')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.todos)
            .includes('a69c0dcc-cde5-11e7-abc4-cec278b6b50a')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.todos)
            .includes('a69c1178-cde5-11e7-abc4-cec278b6b50a')).to.eql(true)

          expect(Object.keys(executionDescription.ctx.userRemit.add.teams).length).to.eql(2)
          expect(Object.keys(executionDescription.ctx.userRemit.add.teams).includes('Fire Safety (North)')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.teams).includes('Birmingham (Red watch)')).to.eql(true)

          expect(Object.keys(executionDescription.ctx.userRemit.add.forms).length).to.eql(3)
          expect(Object.keys(executionDescription.ctx.userRemit.add.forms).includes('test_addIncidentLogEntry')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.forms).includes('test_addIncidentSafetyRecord')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.forms).includes('test_bookSomeoneSick')).to.eql(true)

          expect(Object.keys(executionDescription.ctx.userRemit.add.boards).length).to.eql(2)
          expect(Object.keys(executionDescription.ctx.userRemit.add.boards).includes('test_personalDetails')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.boards).includes('test_propertyViewer')).to.eql(true)

          expect(executionDescription.ctx.userRemit.remove).to.eql({})
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('what if the user only has settings and no favourites yet?', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: [],
          categoryNames: [],
          teamNames: [],
          todoExecutionNames: [],
          formNames: [],
          startable: []
        }
      },
      GET_USER_REMIT_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user-3'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          // console.log(JSON.stringify(executionDescription, null, 2))
          expect(executionDescription.currentStateName).to.eql('GetUserRemit')
          expect(executionDescription.currentResource).to.eql('module:getUserRemit')
          expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')

          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.length).to.eql(5)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('expenses')).to.eql(true)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('gazetteer')).to.eql(true)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('hydrants')).to.eql(true)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('hr')).to.eql(true)
          expect(executionDescription.ctx.userRemit.settings.categoryRelevance.includes('incidents')).to.eql(true)

          expect(executionDescription.ctx.userRemit.favouriteStartableNames).to.eql([])
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('should add fire, water and remove hr category names to the remit', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: [],
          categoryNames: ['Gazetteer', 'hr'],
          teamNames: [],
          todoExecutionNames: [],
          formNames: [],
          startable: []
        }
      },
      GET_USER_REMIT_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          // console.log(JSON.stringify(executionDescription, null, 2))
          expect(executionDescription.currentStateName).to.eql('GetUserRemit')
          expect(executionDescription.currentResource).to.eql('module:getUserRemit')
          expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(Object.keys(executionDescription.ctx.userRemit.add.categories).length).to.eql(2)
          expect(Object.keys(executionDescription.ctx.userRemit.add.categories).includes('Fire')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.categories).includes('Water')).to.eql(true)
          expect(executionDescription.ctx.userRemit.remove.categories)
            .to.eql(['hr'])
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('should add/remove todo execution names to/from the remit', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: [],
          categoryNames: [],
          teamNames: [],
          todoExecutionNames: ['a69c0ac9-cde5-11e7-abc4-cec278b6b50a', 'a69c0ad0-cde5-11e7-abc4-cec278b6b50a'],
          formNames: [],
          startable: []
        }
      },
      GET_USER_REMIT_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          // console.log(JSON.stringify(executionDescription, null, 2))
          expect(executionDescription.currentStateName).to.eql('GetUserRemit')
          expect(executionDescription.currentResource).to.eql('module:getUserRemit')
          expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(Object.keys(executionDescription.ctx.userRemit.add.todos).length).to.eql(3)
          expect(Object.keys(executionDescription.ctx.userRemit.add.todos)
            .includes('a69c0ae8-cde5-11e7-abc4-cec278b6b50a')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.todos)
            .includes('a69c0dcc-cde5-11e7-abc4-cec278b6b50a')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.todos)
            .includes('a69c1178-cde5-11e7-abc4-cec278b6b50a')).to.eql(true)
          expect(executionDescription.ctx.userRemit.remove.todos)
            .to.eql(['a69c0ad0-cde5-11e7-abc4-cec278b6b50a'])
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('should add/remove team names to/from the remit', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: [],
          categoryNames: [],
          teamNames: ['Birmingham (Red watch)', 'Another team'],
          todoExecutionNames: [],
          formNames: [],
          startable: []
        }
      },
      GET_USER_REMIT_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          // console.log(JSON.stringify(executionDescription, null, 2))
          expect(executionDescription.currentStateName).to.eql('GetUserRemit')
          expect(executionDescription.currentResource).to.eql('module:getUserRemit')
          expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(Object.keys(executionDescription.ctx.userRemit.add.teams))
            .to.eql(['Fire Safety (North)'])
          expect(executionDescription.ctx.userRemit.remove.teams)
            .to.eql(['Another team'])
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('should add/remove form names to/from the remit', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: [],
          categoryNames: [],
          teamNames: [],
          todoExecutionNames: [],
          formNames: ['test_bookSomeoneSick', 'processAnExpenseClaim'],
          startable: []
        }
      },
      GET_USER_REMIT_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          // console.log(JSON.stringify(executionDescription, null, 2))
          expect(executionDescription.currentStateName).to.eql('GetUserRemit')
          expect(executionDescription.currentResource).to.eql('module:getUserRemit')
          expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(Object.keys(executionDescription.ctx.userRemit.add.forms).length).to.eql(2)
          expect(Object.keys(executionDescription.ctx.userRemit.add.forms).includes('test_addIncidentLogEntry')).to.eql(true)
          expect(Object.keys(executionDescription.ctx.userRemit.add.forms).includes('test_addIncidentSafetyRecord')).to.eql(true)
          expect(executionDescription.ctx.userRemit.remove.forms)
            .to.eql(['processAnExpenseClaim'])
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('should add/remove board names to/from the remit', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: ['test_personalDetails', 'test_expenses'],
          categoryNames: [],
          teamNames: [],
          todoExecutionNames: [],
          formNames: [],
          startable: []
        }
      },
      GET_USER_REMIT_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          // console.log(JSON.stringify(executionDescription, null, 2))
          expect(executionDescription.currentStateName).to.eql('GetUserRemit')
          expect(executionDescription.currentResource).to.eql('module:getUserRemit')
          expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(Object.keys(executionDescription.ctx.userRemit.add.boards))
            .to.eql(['test_propertyViewer'])
          expect(executionDescription.ctx.userRemit.remove.boards)
            .to.eql(['test_expenses'])
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })

  it('should shut down Tymly nicely', async () => {
    await tymlyService.shutdown()
  })
})
