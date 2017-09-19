/* eslint-env mocha */

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const STATE_MACHINE_NAME = 'fbotTest_people_1_0'

describe('PostgreSQL storage tests', function () {
  this.timeout(5000)

  let registryService
  let tagsService
  let client
  let statebox
  let executionName

  it('should create some flobot services to test PostgreSQL storage', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/people-blueprint'),
          path.resolve(__dirname, './fixtures/blueprints/space-blueprint')
        ],

        config: {}
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        client = flobotServices.storage.client
        statebox = flobotServices.statebox
        registryService = flobotServices.registry
        tagsService = flobotServices.tags
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

  it('should ensure the registry service (which has JSONB columns) still works', function () {
    expect(registryService.registry.fbotTest_planetSizeUnit.value).to.eql('km')
  })

  it('should ensure the tags service (which has JSONB columns) still works', function () {
    expect(tagsService.tags).to.eql(
      {
        gas: {
          tag: 'gas',
          label: 'Gas',
          styling: {
            'background-color': '#80C342'
          }
        },
        terrestrial: {
          tag: 'terrestrial',
          label: 'terrestrial',
          styling: {
            'background-color': '#5F5F5F '
          }
        }
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
  }
  )

  it('Should end db client', function () {
    client.end()
  }
  )
})
