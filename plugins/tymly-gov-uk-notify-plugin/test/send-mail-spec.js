/* eslint-env mocha */

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const process = require('process')

const SEND_MAIL_STATE_MACHINE_NAME = 'test_sendWelcomeMail'
const GET_MESSAGE_STATUS_STATE_MACHINE_NAME = 'test_getMessageStatus'

describe('Send Mail tests', function () {
  this.timeout(process.env.TIMEOUT || 15000)

  let tymlyService, statebox, notificationId, messageStatus = 'created'

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

  it('start state machine to send mail', done => {
    statebox.startExecution(
      {
        emailAddress: 'perm-fail@simulator.notify'
      },
      SEND_MAIL_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (process.env.GOV_UK_NOTIFY_API_KEY) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          notificationId = executionDescription.ctx.sentMail.id
        } else {
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.errorCode).to.eql('MISSING_GOV_UK_NOTIFY_API_KEY')
        }
        done()
      }
    )
  })

  it('should wait for the message to send and check it failed', async () => {
    while (messageStatus === 'created' || messageStatus === 'sending') {
      await new Promise((resolve, reject) => {
        statebox.startExecution(
          {notificationId},
          GET_MESSAGE_STATUS_STATE_MACHINE_NAME,
          {
            sendResponse: 'COMPLETE'
          },
          (err, executionDescription) => {
            if (err) {
              reject(err)
            } else if (executionDescription.status === 'FAILED') {
              reject(new Error(executionDescription.errorCode))
            }
            messageStatus = executionDescription.ctx.message.status
            resolve()
          }
        )
      })
    }
    expect(messageStatus).to.eql('permanent-failure')
  })

  it('start state machine to send mail without an email', done => {
    statebox.startExecution(
      {},
      SEND_MAIL_STATE_MACHINE_NAME,
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

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
