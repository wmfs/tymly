/* eslint-env mocha */

const expect = require('chai').expect
const flobot = require('../lib')
const path = require('path')
const STATE_MACHINE_NAME = 'fbotTest_upsertACatFindACat_1_0'

describe('Memory flobot-storage tests', function () {
  this.timeout(5000)

  let statebox
  let executionName

  it('should create some out-the-box flobot services to test memory storage', function (done) {
    flobot.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/storage-blueprint')
        ]
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        statebox = flobotServices.statebox
        done()
      }
    )
  })

  it('should find the simple-storage state-machine by name', function () {
    const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME)
    expect(stateMachine.name).to.eql(STATE_MACHINE_NAME)
  })

  it('should start (and complete) a simple-storage Flobot', function (done) {
    statebox.startExecution(
      {
        catDoc: {
          'name': 'Rupert',
          'size': 'large',
          'comment': 'Stunning.'
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

  it('should successfully complete upsertACatFindACat execution', function (done) {
    statebox.waitUntilStoppedRunning(
      executionName,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
        expect(executionDescription.currentStateName).to.eql('FindingOne')
        expect(executionDescription.ctx.catDocFromStorage.name).to.eql('Rupert')
        expect(executionDescription.ctx.catDocFromStorage.size).to.eql('large')
        expect(executionDescription.ctx.catDocFromStorage.comment).to.eql('Stunning.')
        done()
      }
    )
  })
})
