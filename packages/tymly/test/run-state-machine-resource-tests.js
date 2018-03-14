/* eslint-env mocha */

const tymly = require('./../lib')
const path = require('path')
const expect = require('chai').expect
const STATE_MACHINE_NAME = 'tymlyTest_indirectDayInTheLife'

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
            path.resolve(__dirname, './fixtures/blueprints/cats-wrapper-blueprint')
          ],

          pluginPaths: [
            path.resolve(__dirname, './fixtures/plugins/cats-plugin')
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
      const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME)
      expect(stateMachine.name).to.eql(STATE_MACHINE_NAME)
    })

    it('should execute cat state machine', async () => {
      const result = await statebox.startExecution(
        {
          petName: 'Rupert',
          gender: 'male',
          hoursSinceLastMotion: 11,
          hoursSinceLastMeal: 5,
          petDiary: []
        }, // input
        STATE_MACHINE_NAME, // state machine name
        {}
      )

      rupert = result.executionName
    })

    it('complete Rupert\'s day', async () => {
      const executionDescription = await statebox.waitUntilStoppedRunning(rupert)

      expect(executionDescription.status).to.eql('SUCCEEDED')
      expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
      expect(executionDescription.currentStateName).to.eql('Start')
      expect(executionDescription.ctx.hoursSinceLastMeal).to.eql(0)
      expect(executionDescription.ctx.hoursSinceLastMotion).to.eql(0)
      expect(executionDescription.ctx.gender).to.eql('male')
      expect(executionDescription.ctx.petDiary).to.be.an('array')
      expect(executionDescription.ctx.petDiary[0]).to.equal('Look out, Rupert is waking up!')
      expect(executionDescription.ctx.petDiary[2]).to.equal('Rupert is walking... where\'s he off to?')
      expect(executionDescription.ctx.petDiary[6]).to.equal('Shh, Rupert is eating...')
    })

    it('shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })
  })
})
