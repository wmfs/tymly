/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const STATE_MACHINE_NAME = 'tymlyTest_aDayInTheLife'

describe('Restart statebox test - cat state machine', function () {
  const tymly = require('tymly')
  let statebox
  this.timeout(10000)
  let rupert

  const tymlyConfig = {
    blueprintPaths: [
      path.resolve(__dirname, './restart-fixtures/blueprints/cats-blueprint')
    ],

    pluginPaths: [
      path.resolve(__dirname, './../lib'),
      path.resolve(__dirname, './restart-fixtures/plugins/cats-plugin')
    ]
  }

  it('boot tymly', function (done) {
    tymly.boot(
      tymlyConfig,
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('find cat state machine', function () {
    const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME)
    expect(stateMachine.name).to.eql(STATE_MACHINE_NAME)
  })

  it('execute cat state machine', function (done) {
    statebox.startExecution(
      {
        petName: 'Rupert',
        gender: 'male',
        hoursSinceLastMotion: 11,
        hoursSinceLastMeal: 5,
        petDiary: []
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        rupert = result.executionName
        done()
      }
    )
  })

  it('reboot tymly', function (done) {
    tymly.boot(
      tymlyConfig,
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('complete Rupert\'s day', function (done) {
    statebox.waitUntilStoppedRunning(
      rupert,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('tymlyTest_aDayInTheLife')
        expect(executionDescription.currentStateName).to.eql('Sleeping')
        expect(executionDescription.ctx.hoursSinceLastMeal).to.eql(0)
        expect(executionDescription.ctx.hoursSinceLastMotion).to.eql(0)
        expect(executionDescription.ctx.gender).to.eql('male')
        expect(executionDescription.ctx.petDiary).to.be.an('array')
        expect(executionDescription.ctx.petDiary[0]).to.equal('Look out, Rupert is waking up!')
        expect(executionDescription.ctx.petDiary[2]).to.equal("Rupert is walking... where's he off to?")
        expect(executionDescription.ctx.petDiary[6]).to.equal('Shh, Rupert is eating...')
        done()
      }
    )
  })
})
