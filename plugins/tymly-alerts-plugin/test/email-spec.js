/* eslint-env mocha */

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const process = require('process')

describe('Simple email tests', function () {
  // NOTE THESE TESTS REQUIRE SOME ENVIRONMENT VARIABLES TO BE SET
  // -------------------------------------------------------------
  //
  // $TYMLY_EMAIL_TRANSPORT      | This should be a JSON.stringify-ed() string that will be used
  //                              | by nodemailer.js (see https://nodemailer.com/)
  //                              |   For example:
  //                              |     {"service":"Gmail", "auth": {"user": "xxx", "pass": "xxx"}}
  //                              |
  // $TYMLY_FROM_EMAIL           | This is the "from" value from which emails will be sent... for example:
  //                              |    John Doe<john.doe@tymlyjs.com>
  //                              |
  // $TYMLY_WELCOME_RECIPIENTS   | Specifies who should receieive the emails, e.g:
  //                              |    john.doe@tymlyjs.com

  this.timeout(process.env.TIMEOUT || 5000)

  let transportConfig
  let from
  let tymlysService

  function failIfNoTransport () {
    if (!transportConfig) {
      console.error('\n\nNo $TYMLY_EMAIL_TRANSPORT set!')
      console.error('-------------------------------')
      console.error('To test the email service/sending-email state the $TYMLY_EMAIL_TRANSPORT environment')
      console.error('variable needs to be set. This should be a JSON.stringify-ed() string that will be used')
      console.error('by nodemailer.js (see https://nodemailer.com/)\n')
      console.error('For example:\n')
      console.error('  $TYMLY_EMAIL_TRANSPORT={"service":"Gmail", "auth": {"user": "xxx", "pass": "xxx"}}\n')
      throw new Error('Email test requires $TYMLY_EMAIL_TRANSPORT to be set')
    }
  }

  it('should grab email transport config via $TYMLY_EMAIL_TRANSPORT', function () {
    transportConfig = process.env.TYMLY_EMAIL_TRANSPORT
    if (transportConfig) {
      transportConfig = JSON.parse(transportConfig)
    }

    failIfNoTransport()
  }
  )

  it('should grab from via $TYMLY_FROM_EMAIL', function () {
    from = process.env.TYMLY_FROM_EMAIL
  }
  )

  it('should create some basic tymly services to test sending emails', function (done) {
    failIfNoTransport()

    tymly.boot(
      {

        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/welcome-email-blueprint')
        ],

        config: {

          email: {
            from: from,
            transport: transportConfig
          }
        }

      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlysService = tymlyServices.tymlys
        done()
      }
    )
  })

  it('should find the send welcome email by id', function () {
    tymlysService.findFlowById('tymlyTest_sendWelcomeEmail_1_0',
      function (err, flow) {
        expect(err).to.eql(null)
        expect(flow.flowId).to.eql('tymlyTest_sendWelcomeEmail_1_0')
      }
    )
  })

  it('should run a Tymly to illustrate a simple email-sending flow', function (done) {
    tymlysService.startNewTymly(
      'tymlyTest_sendWelcomeEmail_1_0',
      {},
      function (err, emailSendingTymly) {
        expect(err).to.eql(null)
        done()
      }
    )
  })
})
