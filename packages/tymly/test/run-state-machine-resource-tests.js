/* eslint-env mocha */

const tymly = require('./../lib')
const path = require('path')
const expect = require('chai').expect
const DAY_IN_THE_LIFE = 'tymlyTest_indirectDayInTheLife'
const HEARTBEAT = 'tymlyTest_heartBeat'
const INDIRECT_HEARTBEAT = 'tymlyTest_indirectHeartBeat'

describe('run-state-machine state resource test', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  describe('positive test', () => {
    let tymlyService
    let statebox
    let rupert

    it('boot tymly', function (done) {
      tymly.boot(
        {
          blueprintPaths: [
            path.resolve(__dirname, './fixtures/blueprints/cats-blueprint'),
            path.resolve(__dirname, './fixtures/blueprints/cats-wrapper-blueprint'),
            path.resolve(__dirname, './fixtures/blueprints/heartbeat-blueprint')
          ],

          pluginPaths: [
            path.resolve(__dirname, './fixtures/plugins/cats-plugin'),
            path.resolve(__dirname, './fixtures/plugins/heartbeat-plugin')
          ]
        },
        function (err, tymlyServices) {
          expect(err).to.eql(null)
          tymlyService = tymlyServices.tymly
          statebox = tymlyServices.statebox
          done()
        }
      )
    })

    for (const machine of [DAY_IN_THE_LIFE, HEARTBEAT, INDIRECT_HEARTBEAT]) {
      it(`find ${machine} state machine`, () => {
        const stateMachine = statebox.findStateMachineByName(machine)
        expect(stateMachine.name).to.eql(machine)
      })
    } // for ...

    it('should execute cat state machine', async () => {
      const result = await statebox.startExecution(
        {
          petName: 'Rupert',
          gender: 'male',
          hoursSinceLastMotion: 11,
          hoursSinceLastMeal: 5,
          petDiary: []
        }, // input
        DAY_IN_THE_LIFE, // state machine name
        {}
      )

      rupert = result.executionName
    })

    it('complete Rupert\'s day', async () => {
      const executionDescription = await statebox.waitUntilStoppedRunning(rupert)

      expect(executionDescription.status).to.eql('SUCCEEDED')
      expect(executionDescription.stateMachineName).to.eql(DAY_IN_THE_LIFE)
      expect(executionDescription.currentStateName).to.eql('Start')
      expect(executionDescription.ctx.hoursSinceLastMeal).to.eql(0)
      expect(executionDescription.ctx.hoursSinceLastMotion).to.eql(0)
      expect(executionDescription.ctx.gender).to.eql('male')
      expect(executionDescription.ctx.petDiary).to.be.an('array')
      expect(executionDescription.ctx.petDiary[0]).to.equal('Look out, Rupert is waking up!')
      expect(executionDescription.ctx.petDiary[2]).to.equal('Rupert is walking... where\'s he off to?')
      expect(executionDescription.ctx.petDiary[6]).to.equal('Shh, Rupert is eating...')
    })

    for (const machine of [HEARTBEAT, INDIRECT_HEARTBEAT]) {
      it(`verify ${machine} state machine`, async () => {
        const heartbeatDescription = await statebox.startExecution(
          {},
          machine,
          {
            sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:heartBeat'
          }
        )

        expect(heartbeatDescription.currentResource).to.eql('module:heartBeat')
        expect(heartbeatDescription.stateMachineName).to.eql(machine)
        expect(heartbeatDescription.status).to.eql('RUNNING')
        expect(heartbeatDescription.ctx.heartbeat).to.eql({ heart: 'ba-dum-dum' })
      })
    }

    it('shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })
  })

  describe('negative test - wrapped state machine doesn\'t exist', () => {
    let tymlyService
    let statebox
    let rupert

    it('boot tymly', function (done) {
      tymly.boot(
        {
          blueprintPaths: [
            path.resolve(__dirname, './fixtures/blueprints/cats-wrapper-blueprint')
          ]
        },
        function (err, tymlyServices) {
          expect(err).to.eql(null)
          tymlyService = tymlyServices.tymly
          statebox = tymlyServices.statebox
          done()
        }
      )
    })

    it('find cat wrapper state machine', () => {
      const catWrapper = statebox.findStateMachineByName(DAY_IN_THE_LIFE)
      expect(catWrapper.name).to.eql(DAY_IN_THE_LIFE)
    })

    it('try to execute cat state machine', async () => {
      const result = await statebox.startExecution(
        {
          petName: 'Rupert',
          gender: 'male',
          hoursSinceLastMotion: 11,
          hoursSinceLastMeal: 5,
          petDiary: []
        }, // input
        DAY_IN_THE_LIFE, // state machine name
        {}
      )

      rupert = result.executionName
    })

    it('Rupert, he no exist', async () => {
      const executionDescription = await statebox.waitUntilStoppedRunning(rupert)

      expect(executionDescription.status).to.eql('FAILED')
      expect(executionDescription.stateMachineName).to.eql(DAY_IN_THE_LIFE)
      expect(executionDescription.currentStateName).to.eql('Start')
    })

    it('shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })
  })
})
