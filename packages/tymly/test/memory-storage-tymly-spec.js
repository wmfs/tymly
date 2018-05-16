/* eslint-env mocha */

const expect = require('chai').expect
const tymly = require('../lib')
const path = require('path')
const STATE_MACHINE_NAME1 = 'tymlyTest_upsertACatFindACat_1_0'
const STATE_MACHINE_NAME2 = 'tymlyTest_findACatWhere_1_0'

describe('Memory tymly-storage tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, statebox, executionName, catModel

  it('should create some out-the-box tymly services to test memory storage', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/storage-blueprint')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        catModel = tymlyServices.storage.models['tymlyTest_cat_1_0']
        done()
      }
    )
  })

  it('should find the simple-storage state-machine by name', function () {
    const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME1)
    expect(stateMachine.name).to.eql(STATE_MACHINE_NAME1)
  })

  it('should start (and complete) a simple-storage Tymly', function (done) {
    statebox.startExecution(
      {
        catDoc: {
          'name': 'Rupert',
          'size': 'large',
          'comment': 'Stunning.'
        }
      }, // input
      STATE_MACHINE_NAME1, // state machine name
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
        expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME1)
        expect(executionDescription.currentStateName).to.eql('FindingOne')
        expect(executionDescription.ctx.catDocFromStorage.name).to.eql('Rupert')
        expect(executionDescription.ctx.catDocFromStorage.size).to.eql('large')
        expect(executionDescription.ctx.catDocFromStorage.comment).to.eql('Stunning.')
        done()
      }
    )
  })

  it('should upsert a new cat', async () => {
    await catModel.upsert({name: 'Wilfred'}, {})
  })

  it('should start a simple-storage Tymly with correct name', function (done) {
    statebox.startExecution(
      {
        catName: 'Wilfred'
      }, // input
      STATE_MACHINE_NAME2, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, result) {
        expect(err).to.eql(null)
        expect(result.status).to.eql('SUCCEEDED')
        expect(result.stateMachineName).to.eql(STATE_MACHINE_NAME2)
        expect(result.currentStateName).to.eql('FindingWilfred')
        expect(result.ctx.catDocFromStorage[0].name).to.eql('Rupert')
        expect(result.ctx.anotherCatDocFromStorage[0].name).to.eql('Wilfred')
        done()
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
