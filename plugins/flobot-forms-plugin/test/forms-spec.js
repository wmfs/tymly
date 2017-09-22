/* eslint-env mocha */

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
const STATE_MACHINE_NAME = 'fbotTest_simpleForm_1_0'

describe('Simple forms tests', function () {
  this.timeout(5000)

  let statebox

  it('should create some basic flobot services to test the UI plugin', function (done) {
    flobot.boot(
      {

        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/forms')
        ]

      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        statebox = flobotServices.statebox
        done()
      }
    )
  })

  it('should find the simple-form state machine by name', function () {
    const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME)
    expect(stateMachine.name).to.eql(STATE_MACHINE_NAME)
  })

  it('should execute cat state machine', function (done) {
    statebox.startExecution(
      {},  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:formFilling'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('FormFilling')
        expect(executionDescription.currentResource).to.eql('module:formFilling')
        expect(executionDescription.stateMachineName).to.eql('fbotTest_simpleForm_1_0')
        expect(executionDescription.status).to.eql('RUNNING')
        expect(executionDescription.ctx).to.eql({ formIdToShowHuman: 'fbotTest_simpleForm_1_0' })
        done()
      }
    )
  })

  /*
    it('should execute a state machine to illustrate a simple form-filling flow', function (done) {
      statebox.startNewFlobot(
        'fbotTest_simpleForm_1_0',
        {},
        function (err, formFillingFlobot) {
          expect(err).to.eql(null)

          expect(formFillingFlobot.flobotId).to.be.a('string')

          expect(formFillingFlobot.flowId).to.eql('fbotTest_simpleForm_1_0')
          expect(formFillingFlobot.stateId).to.eql('formFilling')
          expect(formFillingFlobot.status).to.eql('waitingForHumanInput')

          expect(formFillingFlobot.ctx.formIdToShowToHuman).to.eql('fbotTest_simpleForm_1_0')
          expect(formFillingFlobot.ctx.formDefaultDataPath).to.eql('commentData')

          expect(formFillingFlobot.ctx.commentData).to.eql(undefined)

          flobotId = formFillingFlobot.flobotId

          done()
        }
      )
    })

    it('should simulate a user responding with some form-collected data', function (done) {
      statebox.updateFlobot(
        flobotId,
        {
          data: {
            name: 'Rupert',
            email: 'rupert@flobotjs.com',
            comment: 'A stunning cat.'
          }
        },
        function (err, updatedFlobot) {
          expect(err).to.eql(null)
          expect(updatedFlobot.flobotId).to.be.a('string')
          expect(updatedFlobot.status).to.eql('finished')
          expect(updatedFlobot.stateId).to.eql('upserting')

          expect(updatedFlobot.ctx.commentData.name).to.eql('Rupert')
          expect(updatedFlobot.ctx.commentData.email).to.eql('rupert@flobotjs.com')
          expect(updatedFlobot.ctx.commentData.comment).to.eql('A stunning cat.')

          done()
        }
      )
    })

    it('should show form defaulted with previous data', function (done) {
      statebox.startNewFlobot(
        'fbotTest_simpleForm_1_0',
        {
          data: {
            key: {
              email: 'rupert@flobotjs.com'
            }
          }
        },
        function (err, formUpdatingFlobot) {
          expect(err).to.eql(null)
          expect(formUpdatingFlobot.flobotId).to.be.a('string')

          expect(formUpdatingFlobot.flowId).to.eql('fbotTest_simpleForm_1_0')
          expect(formUpdatingFlobot.stateId).to.eql('formFilling')
          expect(formUpdatingFlobot.status).to.eql('waitingForHumanInput')

          expect(formUpdatingFlobot.ctx.formIdToShowToHuman).to.eql('fbotTest_simpleForm_1_0')

          expect(formUpdatingFlobot.ctx.formIdToShowToHuman).to.eql('fbotTest_simpleForm_1_0')
          expect(formUpdatingFlobot.ctx.formDefaultDataPath).to.eql('commentData')

          expect(formUpdatingFlobot.ctx.commentData.name).to.eql('Rupert')
          expect(formUpdatingFlobot.ctx.commentData.email).to.eql('rupert@flobotjs.com')
          expect(formUpdatingFlobot.ctx.commentData.comment).to.eql('A stunning cat.')

          flobotId = formUpdatingFlobot.flobotId

          done()
        }
      )
    })

    it('should simulate a user updating a doc with form-collected data', function (done) {
      statebox.updateFlobot(
        flobotId,
        {
          data: {
            name: 'Rupert',
            email: 'rupert@flobotjs.com',
            comment: 'A rather stunning cat.'
          }
        },
        function (err, updatedFlobot) {
          expect(err).to.eql(null)
          expect(updatedFlobot.flobotId).to.be.a('string')
          expect(updatedFlobot.status).to.eql('finished')
          expect(updatedFlobot.stateId).to.eql('upserting')

          expect(updatedFlobot.ctx.commentData.name).to.eql('Rupert')
          expect(updatedFlobot.ctx.commentData.email).to.eql('rupert@flobotjs.com')
          expect(updatedFlobot.ctx.commentData.comment).to.eql('A rather stunning cat.')

          done()
        }
      )
    })
    */
})
