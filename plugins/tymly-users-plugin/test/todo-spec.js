/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const HlPgClient = require('hl-pg-client')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const GET_TODO_CHANGES_STATE_MACHINE = 'tymly_getTodoChanges_1_0'
const CREATE_TO_DO_ENTRY = 'tymly_createToDoEntry_1_0'
const REMOVE_TODO_STATE_MACHINE = 'tymly_removeTodoEntries_1_0'

describe('todo changes tymly-users-plugin tests', function () {
  this.timeout(50000)
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox
  let todos

  const pgConnectionString = process.env.PG_CONNECTION_STRING
  const client = new HlPgClient(pgConnectionString)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        todos = tymlyServices.storage.models['tymly_todos']
        done()
      }
    )
  })

  it('should create to do entry for a user', function (done) {
    statebox.startExecution(
      {
        todoTitle: 'To Do Expense Claim',
        stateMachineTitle: 'Process expense claim for User',
        stateMachineCategory: 'Expenses',
        description: 'Homer Simpson is claiming $12 for A pack of Duff Beer',
        id: '5200987c-bb03-11e7-abc4-cec278b6b111'
      },
      CREATE_TO_DO_ENTRY,
      {
        sendResponse: 'COMPLETE',
        userId: 'todo-user'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          expect(executionDescription.currentStateName).to.eql('CreateToDoEntry')
          expect(executionDescription.currentResource).to.eql('module:createToDoEntry')
          expect(executionDescription.stateMachineName).to.eql(CREATE_TO_DO_ENTRY)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  xit('should ensure a todo is present in the list in preparation to remove it', function (done) {
    todos.findById(
      '5200987c-bb03-11e7-abc4-cec278b6b111',
      function (err, doc) {
        expect(err).to.eql(null)
        expect(doc.userId).to.eql('test-user')
        expect(doc.description).to.eql('Homer Simpson is claiming $12 for A pack of Duff Beer')
        done()
      }
    )
  })

  xit('should update a to do entry for a user', function (done) {
    statebox.startExecution(
      {
        todoTitle: 'To Do Expense Claim',
        stateMachineTitle: 'Updated - Process expense claim for User',
        stateMachineCategory: 'Expenses',
        description: 'Homer Simpson is claiming $12 for A pack of Duff Beer',
        id: '5200987c-bb03-11e7-abc4-cec278b6b50a'
      },
      CREATE_TO_DO_ENTRY,
      {
        sendResponse: 'COMPLETE',
        userId: 'todo-user'
      },
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          expect(executionDescription.currentStateName).to.eql('CreateToDoEntry')
          expect(executionDescription.currentResource).to.eql('module:createToDoEntry')
          expect(executionDescription.stateMachineName).to.eql(CREATE_TO_DO_ENTRY)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })
  // for getUserRemit
  xit('should create the settings test resources', function () {
    return sqlScriptRunner('./db-scripts/settings/setup.sql', client)
  })

  // for getUserRemit
  xit('should create the favourites test resources', function () {
    return sqlScriptRunner('./db-scripts/favourites/setup.sql', client)
  })

  // for getTodos
  xit('should create the todos test resources', function () {
    return sqlScriptRunner('./db-scripts/todos/setup.sql', client)
  })

  xit('should start the state machine to get todo changes with no client to do\'s', function (done) {
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

  xit('should start the state machine to get todo changes', function (done) {
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

  xit('should ensure a todo is present in the list in preparation to remove it', function (done) {
    todos.findById(
      '5200987c-bb03-11e7-abc4-cec278b6b50a',
      function (err, doc) {
        expect(err).to.eql(null)
        expect(doc.userId).to.eql('test-user')
        expect(doc.description).to.eql('Homer Simpson is claiming $12 for A pack of Duff Beer')
        done()
      }
    )
  })

  xit('should be able to remove a todo entry from the list', function (done) {
    statebox.startExecution(
      {
        todoId: '5200987c-bb03-11e7-abc4-cec278b6b50a'
      },
      REMOVE_TODO_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  xit('should fail to find the removed todo', function (done) {
    todos.findById(
      '5200987c-bb03-11e7-abc4-cec278b6b50a',
      function (err, doc) {
        expect(err).to.eql(null)
        expect(doc).to.eql(undefined)
        done()
      }
    )
  })

  xit('should fail to find a todo that doesn\'t exist', function (done) {
    statebox.startExecution(
      {
        todoId: 'FAILHERE'
      },
      REMOVE_TODO_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        console.log(executionDescription)
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('FAILED')
        expect(executionDescription.errorCode).to.eql('removeTodoFail')
        done()
      }
    )
  })

  xit('should tear down the settings test resources', function () {
    return sqlScriptRunner('./db-scripts/settings/cleanup.sql', client)
  })

  xit('should tear down the favourites test resources', function () {
    return sqlScriptRunner('./db-scripts/favourites/cleanup.sql', client)
  })

  xit('should tear down the todos test resources', function () {
    return sqlScriptRunner('./db-scripts/todos/cleanup.sql', client)
  })
})
