/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const moment = require('moment')

describe('Context tests', function () {
  const tymly = require('./../lib')
  let tymlyService
  let statebox
  this.timeout(process.env.TIMEOUT || 5000)

  it('load the animal blueprint (which uses of the set-context-data state resource)', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/context-blueprint')
        ],
        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/dummy-user-info-plugin')
        ]
      },
      function (err, tymlyServices) {
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should execute the set-context-data state machine', function (done) {
    statebox.startExecution(
      {}, // input
      'tymlyTest_setContextData_1_0', // state machine name
      {
        sendResponse: 'COMPLETE',
        userId: 'auth0|5a157ade1932044615a1c502'
      }, // options
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          expect(executionDescription.currentStateName).to.eql('SetDefaults')
          expect(executionDescription.currentResource).to.eql('module:setContextData')
          expect(executionDescription.stateMachineName).to.eql('tymlyTest_setContextData_1_0')
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.ctx.formData.catName).to.eql('Rupert')
          expect(executionDescription.ctx.formData.catOwnerId).to.eql('auth0|5a157ade1932044615a1c502')
          expect(executionDescription.ctx.formData.email).to.eql('tymly@xyz.com')
          expect(moment(executionDescription.ctx.formData.catBirthday, moment.ISO_8601, true).isValid()).to.eql(true)
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
