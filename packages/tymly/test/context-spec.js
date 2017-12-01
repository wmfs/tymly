/* eslint-env mocha */
const path = require('path')
const expect = require('chai').expect

describe('Context tests', function () {
  const tymly = require('./../lib')
  let statebox
  this.timeout(process.env.TIMEOUT || 5000)

  it('should load the animal blueprint (which has some context data)', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/animal-blueprint')
        ]
      },
      function (err, tymlyServices) {
        statebox = tymlyServices.statebox
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should execute cat state machine', function (done) {
    statebox.startExecution(
      {},  // input
      'tymlyTest_setContextData_1_0', // state machine name
      {sendResponse: 'COMPLETE'}, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('SetDefaults')
        expect(executionDescription.currentResource).to.eql('module:setContextData')
        expect(executionDescription.stateMachineName).to.eql('tymlyTest_setContextData_1_0')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.ctx.formData.catName).to.eql('Rupert')
        console.log(executionDescription)
        done()
      }
    )
  })
})
