/* eslint-env mocha */

const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
const process = require('process')

describe('Simple email tests', function () {
  // NOTE THESE TESTS REQUIRE SOME ENVIRONMENT VARIABLES TO BE SET
  // -------------------------------------------------------------
  //
  // $FLOBOT_EMAIL_TRANSPORT      | This should be a JSON.stringify-ed() string that will be used
  //                              | by nodemailer.js (see https://nodemailer.com/)
  //                              |   For example:
  //                              |     {"service":"Gmail", "auth": {"user": "xxx", "pass": "xxx"}}
  //                              |
  // $FLOBOT_FROM_EMAIL           | This is the "from" value from which emails will be sent... for example:
  //                              |    John Doe<john.doe@flobotjs.com>
  //                              |
  // $FLOBOT_WELCOME_RECIPIENTS   | Specifies who should receieive the emails, e.g:
  //                              |    john.doe@flobotjs.com

  this.timeout(25000)

  let transportConfig
  let from
  let flobotsService

  function failIfNoTransport () {
    if (!transportConfig) {
      console.error('\n\nNo $FLOBOT_EMAIL_TRANSPORT set!')
      console.error('-------------------------------')
      console.error('To test the email service/sending-email state the $FLOBOT_EMAIL_TRANSPORT environment')
      console.error('variable needs to be set. This should be a JSON.stringify-ed() string that will be used')
      console.error('by nodemailer.js (see https://nodemailer.com/)\n')
      console.error('For example:\n')
      console.error('  $FLOBOT_EMAIL_TRANSPORT={"service":"Gmail", "auth": {"user": "xxx", "pass": "xxx"}}\n')
      throw new Error('Email test requires $FLOBOT_EMAIL_TRANSPORT to be set')
    }
  }

  it('should grab email transport config via $FLOBOT_EMAIL_TRANSPORT', function () {
    transportConfig = process.env.FLOBOT_EMAIL_TRANSPORT
    if (transportConfig) {
      transportConfig = JSON.parse(transportConfig)
    }

    failIfNoTransport()
  }
  )

  it('should grab from via $FLOBOT_FROM_EMAIL', function () {
    from = process.env.FLOBOT_FROM_EMAIL
  }
  )

  it('should create some basic flobot services to test sending emails', function (done) {
    failIfNoTransport()

    flobot.boot(
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
      function (err, flobotServices) {
        expect(err).to.eql(null)
        flobotsService = flobotServices.flobots
        done()
      }
    )
  })

  it('should find the send welcome email by id', function () {
    flobotsService.findFlowById('fbotTest_sendWelcomeEmail_1_0',
      function (err, flow) {
        expect(err).to.eql(null)
        expect(flow.flowId).to.eql('fbotTest_sendWelcomeEmail_1_0')
      }
    )
  })

  it('should run a Flobot to illustrate a simple email-sending flow', function (done) {
    flobotsService.startNewFlobot(
      'fbotTest_sendWelcomeEmail_1_0',
      {},
      function (err, emailSendingFlobot) {
        expect(err).to.eql(null)
        done()
      }
    )
  })
})
