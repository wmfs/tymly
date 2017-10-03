/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const STATE_MACHINE_NAME = 'fbotTest_aDayInTheLife'

describe('Simple Tymly test', function () {
  const tymly = require('./../lib')
  let statebox
  this.timeout(5000)
  let rupert

  it('should create some basic tymly services to run a simple cat blueprint', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
        ],

        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should find cat state machine', function () {
    const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME)
    expect(stateMachine.name).to.eql(STATE_MACHINE_NAME)
  })

  it('should fail finding dog state machine', function () {
    const stateMachine = statebox.findStateMachineByName('DOGS!')
    expect(stateMachine).to.be.an('undefined')
  })

  it('should execute cat state machine', function (done) {
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

  it('should successfully complete Rupert\'s day', function (done) {
    statebox.waitUntilStoppedRunning(
      rupert,
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('fbotTest_aDayInTheLife')
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

  it('should fail to execute dog state machine', function (done) {
    statebox.startExecution(
      {
        dogName: 'Scooby',
        gender: 'male',
        hoursSinceLastMotion: 1,
        hoursSinceLastMeal: 0,
        petDiary: []
      },  // input
      'DOG_MACHINE', // state machine name
      {}, // options
      function (err, result) {
        expect(err.message).to.eql("Unknown stateMachine with name 'DOG_MACHINE'")
        done()
      }
    )
  })
})
