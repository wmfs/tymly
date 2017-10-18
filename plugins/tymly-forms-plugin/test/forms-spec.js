/* eslint-env mocha */

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const STATE_MACHINE_NAME = 'tymlyTest_simpleForm_1_0'

describe('Simple forms tests', function () {
  this.timeout(5000)

  let statebox
  let executionName

  it('should create some basic tymly services to test the UI plugin', function (done) {
    tymly.boot(
      {

        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/forms')
        ]

      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
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
        expect(executionDescription.stateMachineName).to.eql('tymlyTest_simpleForm_1_0')
        expect(executionDescription.status).to.eql('RUNNING')
        expect(executionDescription.ctx).to.eql(
          {
            formIdToShowHuman: 'tymlyTest_simpleForm_1_0'
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
          email: 'rupert@tymlyjs.io'
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
          email: 'rupert@tymlyjs.io'
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
        expect(executionDescription.stateMachineName).to.eql('tymlyTest_simpleForm_1_0')
        expect(executionDescription.status).to.eql('RUNNING')
        expect(executionDescription.ctx).to.eql(
          {
            commentData: {
              _executionName: '1',
              formData: {
                email: 'rupert@tymlyjs.io',
                name: 'Rupert'
              }
            },
            formIdToShowHuman: 'tymlyTest_simpleForm_1_0',
            key: {
              email: 'rupert@tymlyjs.io'
            }
          }
        )
        done()
      }
    )
  })

  /*
      it('should simulate a user updating a doc with form-collected data', function (done) {
        statebox.updateTymly(
          tymlyId,
          {
            data: {
              name: 'Rupert',
              email: 'rupert@tymlyjs.com',
              comment: 'A rather stunning cat.'
            }
          },
          function (err, updatedTymly) {
            expect(err).to.eql(null)
            expect(updatedTymly.tymlyId).to.be.a('string')
            expect(updatedTymly.status).to.eql('finished')
            expect(updatedTymly.stateId).to.eql('upserting')

            expect(updatedTymly.ctx.commentData.name).to.eql('Rupert')
            expect(updatedTymly.ctx.commentData.email).to.eql('rupert@tymlyjs.com')
            expect(updatedTymly.ctx.commentData.comment).to.eql('A rather stunning cat.')

            done()
          }
        )
      })
      */
})
