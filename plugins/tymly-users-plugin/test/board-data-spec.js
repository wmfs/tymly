/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const process = require('process')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

describe('get-board-data tymly-users-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService, statebox, client, animalModel, humanModel, boardService, formService
  const GET_SINGLE_BOARD_STATE_MACHINE = 'test_getSingleBoard_1_0'
  const GET_MULTIPLE_BOARDS_STATE_MACHINE = 'test_getMultipleBoards_1_0'

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

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
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        animalModel = tymlyServices.storage.models['test_animal']
        humanModel = tymlyServices.storage.models['test_human']
        boardService = tymlyServices.boards
        formService = tymlyServices.forms
        done()
      }
    )
  })

  it('should ensure each form has a shasum associated with it', (done) => {
    console.log(Object.keys(formService.forms))
    Object.keys(formService.forms).map((form) => {
      expect(formService.forms[form].shasum)
    })
    done()
  })

  it('should ensure each board has a shasum associated with it', (done) => {
    console.log(Object.keys(boardService.boards))
    Object.keys(boardService.boards).map((board) => {
      expect(boardService.boards[board].shasum)
    })
    done()
  })

  it('insert some \'human\' test data', (done) => {
    humanModel.create({
      name: 'Alfred',
      age: '57'
    })
      .then(() => done())
      .catch(err => done(err))
  })

  it('insert some \'animal\' test data', (done) => {
    animalModel.create({
      name: 'Alfred',
      age: '2',
      type: 'dog'
    })
      .then(() => done())
      .catch(err => done(err))
  })

  it('run state machine to get board data from one table', function (done) {
    statebox.startExecution(
      {
        boardKeys: {
          name: 'Alfred'
        }
      },
      GET_SINGLE_BOARD_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      (err, executionDescription) => {
        console.log(executionDescription)
        expect(executionDescription.ctx.data.name).to.eql('Alfred')
        expect(executionDescription.ctx.data.age).to.eql('57')
        expect(err).to.eql(null)
        done(err)
      }
    )
  })

  it('run state machine to get board data from two tables', function (done) {
    statebox.startExecution(
      {
        boardKeys: {
          name: 'Alfred'
        }
      },
      GET_MULTIPLE_BOARDS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      (err, executionDescription) => {
        console.log(executionDescription.ctx.data)
        expect(executionDescription.ctx.data.human.age).to.eql('57')
        expect(executionDescription.ctx.data.animal.type).to.eql('dog')
        expect(err).to.eql(null)
        done(err)
      }
    )
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })

  it('should shut down Tymly', async () => {
    await tymlyService.shutdown()
  })
})
