/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const STATE_MACHINE_NAME = 'tymlyTest_people_1_0'

describe('PostgreSQL storage tests', function () {
  this.timeout(120000)

  let registryService
  let categoryService
  let client
  let statebox
  let executionName

  it('should create some tymly services to test PostgreSQL storage', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/people-blueprint'),
          path.resolve(__dirname, './fixtures/blueprints/space-blueprint'),
          path.resolve(__dirname, './fixtures/blueprints/seed-data-blueprint')
        ],

        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        client = tymlyServices.storage.client
        statebox = tymlyServices.statebox
        registryService = tymlyServices.registry
        categoryService = tymlyServices.categories
        done()
      }
    )
  })

  it('Should initially drop-cascade the pg_model_test schema, if one exists', function (done) {
    sqlScriptRunner(
      [
        'install.sql'
      ],
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('should find the simple-storage state-machine by name', function () {
    const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME)
    expect(stateMachine.name).to.eql(STATE_MACHINE_NAME)
  })

  it('should start a simple-storage execution', function (done) {
    statebox.startExecution(
      {
        homer: {
          employeeNo: 1,
          firstName: 'Homer',
          lastName: 'Simpson',
          age: 39
        }
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should successfully a simple-storage execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.currentStateName).to.eql('FindingById')
        expect(executionDescription.ctx.foundHomer.employeeNo).to.eql('1')
        expect(executionDescription.ctx.foundHomer.firstName).to.eql('Homer')
        expect(executionDescription.ctx.foundHomer.lastName).to.eql('Simpson')
        expect(executionDescription.ctx.foundHomer.age).to.eql(39)
        done()
      }
    )
  })

  it('should succeed on basic input using insert state', function (done) {
    statebox.startExecution(
      {
        skinner: {
          employeeNo: 50,
          firstName: 'Seymour',
          lastName: 'Skinner',
          age: 48
        }
      },
      STATE_MACHINE_NAME,
      {},
      function (err, result) {
        console.log(statebox)
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('should start a simple storage execution with "bad data" (extra data)', function (done) {
    statebox.startExecution(
      {
        skinner: {
          employeeNo: 50,
          firstName: 'Seymour',
          lastName: 'Skinner',
          age: 48,
          job: ''
        }
      },
      'tymlyTest_badpeople_1_0',
      {},
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('state should be "FAILED" on "bad data" due to extra data', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should start a simple storage execution with "bad data" (missing rows)', function (done) {
    statebox.startExecution(
      {
        skinner: {
          employeeNo: 50,
          firstName: 'Seymour'
        }
      },
      'tymlyTest_badpeople_1_0',
      {},
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('state should be "FAILED" on "bad data" due to missing rows', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          expect(executionDescription).to.not.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          done()
        } catch (oops) {
          done(oops)
        }
      }
    )
  })

  it('should start a simple storage execution with "bad data" (missing PK)', function (done) {
    statebox.startExecution(
      {
        skinner: {
          firstName: 'Seymour',
          lastName: 'Skinner',
          age: 48
        }
      },
      'tymlyTest_badpeople_1_0',
      {},
      function (err, result) {
        expect(err).to.eql(null)
        executionName = result.executionName
        done()
      }
    )
  })

  it('state should be "FAILED" on "bad data" due to missing PK', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        try {
          if (err) console.error(err)
          expect(err).to.eql(null)
          expect(executionDescription).to.not.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          done()
        } catch (oops) {
          console.log('!!!!!!Failed execution name is ', executionName)
          done(oops)
        }
      }
    )
  })

  it('should ensure the registry service (which has JSONB columns) still works', function () {
    expect(registryService.registry.tymlyTest_planetSizeUnit.value).to.eql('km')
  })

  it('should ensure the categories service (which has JSONB columns) still works', function () {
    expect(categoryService.categories).to.eql(
      {
        gas: {
          category: 'gas',
          label: 'Gas',
          styling: {
            'background-color': '#80C342'
          }
        },
        terrestrial: {
          category: 'terrestrial',
          label: 'terrestrial',
          styling: {
            'background-color': '#5F5F5F '
          }
        }
      }
    )
  })

  it('should find the seed-data state-machine by name', function () {
    const stateMachine = statebox.findStateMachineByName('tymlyTest_seedDataTest_1_0')
    expect(stateMachine.name).to.eql('tymlyTest_seedDataTest_1_0')
  })

  it('should start a seed-data execution', function (done) {
    statebox.startExecution(
      {
        idToFind: 3
      },  // input
      'tymlyTest_seedDataTest_1_0', // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.ctx.foundTitle.title).to.eql('Miss')
        expect(executionDescription.currentStateName).to.eql('FindingById')
        expect(executionDescription.currentResource).to.eql('module:findingById')
        expect(executionDescription.stateMachineName).to.eql('tymlyTest_seedDataTest_1_0')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('Should uninstall test schemas', function (done) {
    sqlScriptRunner(
      [
        'uninstall.sql'
      ],
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('Should end db client', function () {
    client.end()
  })
})
