/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const HlPgClient = require('hl-pg-client')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_USER_REMIT_STATE_MACHINE = 'tymly_getUserRemit_1_0'

describe('user-remit tymly-users-plugin tests', function () {
  this.timeout(5000)
  let statebox

  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
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
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetUserRemit')
        expect(executionDescription.currentResource).to.eql('module:getUserRemit')
        expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.userRemit.settings).to.eql(['gazetteer', 'hr', 'hydrants', 'incidents', 'expenses'])
        expect(executionDescription.ctx.userRemit.favouriteStartableNames).to.eql(['notifications', 'settings'])
        expect(Object.keys(executionDescription.ctx.userRemit.add.categoryNames))
          .to.eql(['Gazetteer', 'Fire', 'Water'])
        expect(Object.keys(executionDescription.ctx.userRemit.add.todoExecutionNames)).to.eql([
          'a69c0ac9-cde5-11e7-abc4-cec278b6b50a',
          'a69c0ae8-cde5-11e7-abc4-cec278b6b50a',
          'a69c0dcc-cde5-11e7-abc4-cec278b6b50a',
          'a69c1178-cde5-11e7-abc4-cec278b6b50a'])
        expect(executionDescription.ctx.userRemit.remove).to.eql({})
        done()
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
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetUserRemit')
        expect(executionDescription.currentResource).to.eql('module:getUserRemit')
        expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.userRemit.settings).to.eql(['expenses', 'gazetteer', 'hydrants', 'hr', 'incidents'])
        expect(executionDescription.ctx.userRemit.favouriteStartableNames).to.eql([])
        done()
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
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetUserRemit')
        expect(executionDescription.currentResource).to.eql('module:getUserRemit')
        expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(Object.keys(executionDescription.ctx.userRemit.add.categoryNames))
          .to.eql(['Fire', 'Water'])
        expect(executionDescription.ctx.userRemit.remove.categoryNames)
          .to.eql(['hr'])
        done()
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
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetUserRemit')
        expect(executionDescription.currentResource).to.eql('module:getUserRemit')
        expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(Object.keys(executionDescription.ctx.userRemit.add.todoExecutionNames)).to.eql([
          'a69c0ae8-cde5-11e7-abc4-cec278b6b50a',
          'a69c0dcc-cde5-11e7-abc4-cec278b6b50a',
          'a69c1178-cde5-11e7-abc4-cec278b6b50a'
        ])
        expect(executionDescription.ctx.userRemit.remove.todoExecutionNames)
          .to.eql(['a69c0ad0-cde5-11e7-abc4-cec278b6b50a'])
        done()
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
        expect(err).to.eql(null)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetUserRemit')
        expect(executionDescription.currentResource).to.eql('module:getUserRemit')
        expect(executionDescription.stateMachineName).to.eql(GET_USER_REMIT_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(Object.keys(executionDescription.ctx.userRemit.add.teamNames))
          .to.eql(['Fire Safety (North)'])
        expect(executionDescription.ctx.userRemit.remove.teamNames)
          .to.eql(['Another team'])
        done()
      }
    )
  })

  it('should tear down the settings test resources', function () {
    return sqlScriptRunner('./db-scripts/settings/cleanup.sql', client)
  })

  it('should tear down the favourites test resources', function () {
    return sqlScriptRunner('./db-scripts/favourites/cleanup.sql', client)
  })

  it('should tear down the remit test resources', function () {
    return sqlScriptRunner('./db-scripts/remit/cleanup.sql', client)
  })
})
