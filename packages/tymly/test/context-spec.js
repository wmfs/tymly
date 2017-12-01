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

        // pluginPaths: [
        //  path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        // ]
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
      {sendRespose: 'COMPLETE'}, // options
      function (err, result) {
        // console.log(result)
        expect(err).to.eql(null)
        done()
      }
    )
  })
})
