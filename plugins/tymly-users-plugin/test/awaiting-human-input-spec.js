/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

const HEARTBEAT_STATE_MACHINE = 'tymly_testHeartbeat_1_0'

describe('awaitingUserInput state tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let statebox

  // const pgConnectionString = process.env.PG_CONNECTION_STRING
  // const client = new PGClient(pgConnectionString)

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should execute awaitingHumanInput state machine and expect defaults to come through', function (done) {
    statebox.startExecution(
      {},
      HEARTBEAT_STATE_MACHINE,
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:awaitingHumanInput'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('TestHeartbeat')
        expect(executionDescription.currentResource).to.eql('module:awaitingHumanInput')
        expect(executionDescription.stateMachineName).to.eql(HEARTBEAT_STATE_MACHINE)
        expect(executionDescription.status).to.eql('RUNNING')
        expect(executionDescription.ctx.requiredHumanInput.data.empNo).to.eql(0)
        expect(executionDescription.ctx.requiredHumanInput.data.status).to.eql('Probationary')
        done()
      }
    )
  })

  it('should overwrite any default values if config passed in', function (done) {
    statebox.startExecution(
      {
        someDefaultFormData: {
          empNo: 14345,
          status: 'Permanent'
        }
      },
      HEARTBEAT_STATE_MACHINE,
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:awaitingHumanInput'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('TestHeartbeat')
        expect(executionDescription.currentResource).to.eql('module:awaitingHumanInput')
        expect(executionDescription.stateMachineName).to.eql(HEARTBEAT_STATE_MACHINE)
        expect(executionDescription.status).to.eql('RUNNING')
        expect(executionDescription.ctx.requiredHumanInput.data.empNo).to.eql(14345)
        expect(executionDescription.ctx.requiredHumanInput.data.status).to.eql('Permanent')
        done()
      }
    )
  })
})
