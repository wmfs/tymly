/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const tymly = require('../lib')
const DateTime = require('luxon').DateTime

const TestTimestamp = DateTime.local(2000, 2, 28, 22, 35, 0)
const TestTimestampString = `${TestTimestamp}`

const timestampStateMachine = 'tymlyTest_timestamp_1_0'

describe('timestamp state resources', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let statebox

  it('boot Tymly', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/timestamp-blueprint')
        ],
        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/say-yes-rbac-plugin')
        ]
      },
      function (err, tymlyServices) {
        if (err) return done(err)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox

        tymlyServices.timestamp.timeProvider = {
          now () {
            return TestTimestamp
          }
        } // debug provider

        done()
      }
    )
  })

  it('run the state machine to get a timestamp', async () => {
    const execDesc = await statebox.startExecution(
      { },
      timestampStateMachine,
      { sendResponse: 'COMPLETE' }
    )
    expect(execDesc.ctx.timestamp).to.eql(TestTimestamp)
    expect(execDesc.ctx.timestamp.toString()).to.eql(TestTimestampString)
  })

  it('shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
