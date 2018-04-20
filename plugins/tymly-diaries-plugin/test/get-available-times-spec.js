/* eslint-env mocha */

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

describe('Test the get available times state resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, statebox // , bookingModel

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('should run the tymly service', done => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './..')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/test-blueprint')
        ]
      },
      (err, tymlyServices) => {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        // bookingModel = tymlyServices.storage.models['test_doctorBookings']
        done()
      }
    )
  })

  it('should start the get available times state machine', done => {
    statebox.startExecution(
      {
        date: new Date()
      },
      'test_getAvailableTimes_1_0',
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (err) return done(err)
        console.log(JSON.stringify(executionDescription, null, 2))
        console.log('Output:', executionDescription.ctx.availableTimes)
        expect(executionDescription.currentStateName).to.eql('GetAvailableTimes')
        expect(executionDescription.currentResource).to.eql('module:getAvailableTimes')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
