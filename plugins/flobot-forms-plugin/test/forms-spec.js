/* eslint-env mocha */

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
const STATE_MACHINE_NAME = 'fbotTest_simpleForm_1_0'

describe('Simple forms tests', function () {
  this.timeout(5000)

  let statebox
  let executionName

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

  it('should start a form-filling execution', function (done) {
    statebox.startExecution(
      {},  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:formFilling'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        executionName = executionDescription.executionName
        expect(executionDescription.currentStateName).to.eql('FormFilling')
        expect(executionDescription.currentResource).to.eql('module:formFilling')
        expect(executionDescription.stateMachineName).to.eql('fbotTest_simpleForm_1_0')
        expect(executionDescription.status).to.eql('RUNNING')
        expect(executionDescription.ctx).to.eql(
          {
            formIdToShowHuman: 'fbotTest_simpleForm_1_0'
          }
        )
        done()
      }
    )
  })

  it('should sendTaskSuccess (i.e. some form data)', function (done) {
    statebox.sendTaskSuccess(
      executionName,
      {
        formData: {
          name: 'Rupert',
          email: 'rupert@flobotjs.io'
        }
      }, // output
      {}, // executionOptions
      function (err) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should start a new form-filling execution (but details defaulted from before)', function (done) {
    statebox.startExecution(
      {
        key: {
          email: 'rupert@flobotjs.io'
        }
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:formFilling'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        executionName = executionDescription.executionName
        expect(executionDescription.currentStateName).to.eql('FormFilling')
        expect(executionDescription.currentResource).to.eql('module:formFilling')
        expect(executionDescription.stateMachineName).to.eql('fbotTest_simpleForm_1_0')
        expect(executionDescription.status).to.eql('RUNNING')
        expect(executionDescription.ctx).to.eql(
          {
            commentData: {
              _executionName: '1',
              formData: {
                email: 'rupert@flobotjs.io',
                name: 'Rupert'
              }
            },
            formIdToShowHuman: 'fbotTest_simpleForm_1_0',
            key: {
              email: 'rupert@flobotjs.io'
            }
          }
        )
        done()
      }
    )
  })

  /*
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
