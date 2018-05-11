/* eslint-env mocha */

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const process = require('process')

const SEND_SMS_STATE_MACHINE_NAME = 'test_sendWelcomeSms'
const SEND_INVALID_STATE_MACHINE_NAME = 'test_sendWelcomeInvalid'

describe('Send SMS tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, statebox

  it('boot tymly', done => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/welcome-blueprint')
        ],
        config: {}
      },
      (err, tymlyServices) => {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('start state machine to send SMS with a phone number expected to succeed', done => {
    statebox.startExecution(
      {
        phoneNumber: '07700900111'
      },
      SEND_SMS_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (process.env.GOV_UK_NOTIFY_API_KEY) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
        } else {
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.errorCode).to.eql('MISSING_GOV_UK_NOTIFY_API_KEY')
        }
        done()
      }
    )
  })

  it('start state machine to send SMS with an invalid phone number', done => {
    statebox.startExecution(
      {
        phoneNumber: '077009'
      },
      SEND_SMS_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (process.env.GOV_UK_NOTIFY_API_KEY) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.errorMessage.statusCode).to.eql(400)
          expect(executionDescription.errorMessage.error.errors[0].error).to.eql('ValidationError')
          expect(executionDescription.errorMessage.error.errors[0].message).to.eql('phone_number Not enough digits')
        } else {
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.errorCode).to.eql('MISSING_GOV_UK_NOTIFY_API_KEY')
        }
        done()
      }
    )
  })

  it('start state machine to send SMS without a phone number', done => {
    statebox.startExecution(
      {},
      SEND_SMS_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (process.env.GOV_UK_NOTIFY_API_KEY) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.errorCode).to.eql('NO_EMAIL_OR_PHONE_NUMBER')
        } else {
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.errorCode).to.eql('MISSING_GOV_UK_NOTIFY_API_KEY')
        }
        done()
      }
    )
  })

  it('start state machine to send SMS with an invalid message type', done => {
    statebox.startExecution(
      {
        phoneNumber: '07700900111'
      },
      SEND_INVALID_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (process.env.GOV_UK_NOTIFY_API_KEY) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.errorCode).to.eql('INVALID_MESSAGE_TYPE')
        } else {
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.errorCode).to.eql('MISSING_GOV_UK_NOTIFY_API_KEY')
        }
        done()
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
