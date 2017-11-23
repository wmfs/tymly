/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const HlPgClient = require('hl-pg-client')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_TODO_CHANGES_STATE_MACHINE = 'tymly_getTodoChanges_1_0'

describe('todo changes tymly-users-plugin tests', function () {
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

  // for getUserRemit
  it('should create the settings test resources', function () {
    return sqlScriptRunner('./db-scripts/settings/setup.sql', client)
  })

  // for getUserRemit
  it('should create the favourites test resources', function () {
    return sqlScriptRunner('./db-scripts/favourites/setup.sql', client)
  })

  // for getTodos
  it('should create the todos test resources', function () {
    return sqlScriptRunner('./db-scripts/todos/setup.sql', client)
  })

  it('should start the state machine to get todo changes with no client to do\'s', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: [],
          categoryNames: [],
          teamNames: [],
          todoExecutionNames: [],
          formNames: [],
          startable: []
        }, // for getUserRemit
        clientTodoExecutionNames: [] // for getTodos
      },
      GET_TODO_CHANGES_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        // console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetTodoChanges')
        expect(executionDescription.currentResource).to.eql('module:getTodoChanges')
        expect(executionDescription.stateMachineName).to.eql(GET_TODO_CHANGES_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(Object.keys(executionDescription.ctx.todoChanges.add.todoChanges)).to.eql([
          '5200987c-bb03-11e7-abc4-cec278b6b50a',
          '0d625558-ce99-11e7-b7e3-c38932399c15'
        ])
        expect(executionDescription.ctx.todoChanges.remove).to.eql([])
        done()
      }
    )
  })

  it('should start the state machine to get todo changes', function (done) {
    statebox.startExecution(
      {
        clientManifest: {
          boardNames: [],
          categoryNames: [],
          teamNames: [],
          todoExecutionNames: [],
          formNames: [],
          startable: []
        }, // for getUserRemit
        clientTodoExecutionNames: [
          '5200987c-bb03-11e7-abc4-cec278b6b50a',
          '52009d36-bb03-11e7-abc4-cec278b6b50a',
          '52009e4e-bb03-11e7-abc4-cec278b6b50a',
          '52009f20-bb03-11e7-abc4-cec278b6b50a',
          '52009ff2-bb03-11e7-abc4-cec278b6b50a'
        ] // for getTodos
      },
      GET_TODO_CHANGES_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        // console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('GetTodoChanges')
        expect(executionDescription.currentResource).to.eql('module:getTodoChanges')
        expect(executionDescription.stateMachineName).to.eql(GET_TODO_CHANGES_STATE_MACHINE)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(Object.keys(executionDescription.ctx.todoChanges.add.todoChanges)).to.eql(['0d625558-ce99-11e7-b7e3-c38932399c15'])
        expect(executionDescription.ctx.todoChanges.remove.todoChanges).to.eql([
          '52009d36-bb03-11e7-abc4-cec278b6b50a',
          '52009e4e-bb03-11e7-abc4-cec278b6b50a',
          '52009f20-bb03-11e7-abc4-cec278b6b50a',
          '52009ff2-bb03-11e7-abc4-cec278b6b50a'
        ])
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

  it('should tear down the todos test resources', function () {
    return sqlScriptRunner('./db-scripts/todos/cleanup.sql', client)
  })
})
