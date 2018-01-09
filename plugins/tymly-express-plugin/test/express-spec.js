/* eslint-env mocha */

'use strict'
const PORT = 3003
const jwt = require('jsonwebtoken')
const rest = require('restler')
const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const Buffer = require('safe-buffer').Buffer

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

function sendToken (adminToken) {
  const options = {
    headers: {
      Accept: '*/*'
    }
  }
  if (adminToken) {
    options.headers.authorization = 'Bearer ' + adminToken
  }
  return options
}

describe('Simple Express tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, app, adminToken, irrelevantToken, rupert, alan, statebox
  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'
  const executionsUrl = `http://localhost:${PORT}/executions/`
  const remitUrl = `http://localhost:${PORT}/remit/`
  const GET_FROM_API_STATE_MACHINE = 'tymlyTest_getFromApi_1_0'

  it('should create a usable admin token for Dave', function () {
    adminToken = jwt.sign(
      {},
      new Buffer(secret, 'base64'),
      {
        subject: 'Dave',
        audience: audience
      }
    )
  })

  it('should create a usable token for Steve', function () {
    irrelevantToken = jwt.sign(
      {},
      new Buffer(secret, 'base64'),
      {
        subject: 'Steve',
        audience: audience
      }
    )
  })

  it('should create some basic tymly services to run a simple cat blueprint', function (done) {
    process.env.TEST_API_URL = 'http://headers.jsontest.com'
    process.env.TEST_TOKEN = 'testToken'

    tymly.boot(
      {

        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          path.resolve(__dirname, './fixtures/plugins/cats-plugin'),
          require.resolve('tymly-solr-plugin'),
          require.resolve('tymly-users-plugin')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint'),
          path.resolve(__dirname, './fixtures/blueprints/website-blueprint')
        ],

        config: {

          staticRootDir: path.resolve(__dirname, './output'),

          auth: {
            secret: secret,
            audience: audience
          },

          defaultUsers: {
            'Dave': ['tymlyTest_tymlyTestAdmin'],
            'Steve': ['spaceCadet']
          }

        }

      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        app = tymlyServices.server.app
        statebox = tymlyServices.statebox
        tymlyServices.rbac.rbac.debug()
        done()
      }
    )
  })

  it('should start Express app', function (done) {
    app.listen(PORT, function () {
      console.log('\n')
      console.log(`Example app listening on port ${PORT}!\n`)
      done()
    })
  })

  // CHECK THAT A VALID JWT REQUIRED TO USE /TYMLY'S API
  // ---------------------------------------------------

  it('should fail to create a new Tymly without a JWT', function (done) {
    rest.postJson(
      executionsUrl,
      {
        stateMachineName: 'tymlyTest_cat_1_0',
        data: {petName: 'Rupert'}
      }
    ).on(
      'complete',
      function (rupert, res) {
        expect(res.statusCode).to.equal(401)
        done()
      }
    )
  })

  it('should fail updating a Tymly without a JWT', function (done) {
    rest.putJson(
      executionsUrl + '/' + alan,
      {
        action: 'SendTaskHeartbeat',
        output: {
          sound: 'Car engine'
        }
      }
    ).on('complete', function (errHtml, res) {
      expect(res.statusCode).to.equal(401)
      done()
    })
  })

  it('should fail getting a Tymly without a JWT', function (done) {
    rest.get(executionsUrl + rupert).on('complete', function (badTymly, res) {
      expect(res.statusCode).to.equal(401)
      done()
    })
  })

  it('should fail getting the user\'s remit without a JWT', function (done) {
    rest.get(remitUrl).on('complete', function (remit, res) {
      expect(res.statusCode).to.equal(401)
      done()
    })
  })

  // VALID JWTs SHOULD WORK
  // ----------------------
  it('should create a new Rupert execution', function (done) {
    rest.postJson(
      executionsUrl,
      {
        stateMachineName: 'tymlyTest_cat_1_0',
        input: {
          petName: 'Rupert',
          gender: 'male',
          hoursSinceLastMotion: 11,
          hoursSinceLastMeal: 5,
          petDiary: []
        },
        options: {
          instigatingClient: {
            appName: 'tymly-express-plugin',
            domain: 'express-spec.js'
          }
        }
      },
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(201)
      expect(executionDescription.status).to.eql('RUNNING')
      expect(executionDescription.currentStateName).to.eql('WakingUp')
      expect(executionDescription.ctx.petName).to.eql('Rupert')
      expect(executionDescription.executionOptions).to.eql(
        {
          action: 'startExecution',
          instigatingClient: {
            appName: 'tymly-express-plugin',
            domain: 'express-spec.js'
          },
          'stateMachineName': 'tymlyTest_cat_1_0',
          userId: 'Dave'
        }
      )
      rupert = executionDescription.executionName
      done()
    })
  })

  it('should get Rupert execution description', function (done) {
    rest.get(
      executionsUrl + '/' + rupert,
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(200)
      expect(executionDescription.ctx.petName).to.equal('Rupert')
      done()
    })
  })

  it('should successfully complete Rupert\'s day', function (done) {
    statebox.waitUntilStoppedRunning(
      rupert,
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('tymlyTest_cat_1_0')
          expect(executionDescription.currentStateName).to.eql('Sleeping')
          expect(executionDescription.ctx.hoursSinceLastMeal).to.eql(0)
          expect(executionDescription.ctx.hoursSinceLastMotion).to.eql(0)
          expect(executionDescription.ctx.gender).to.eql('male')
          expect(executionDescription.ctx.petDiary).to.be.an('array')
          expect(executionDescription.ctx.petDiary[0]).to.equal('Look out, Rupert is waking up!')
          expect(executionDescription.ctx.petDiary[2]).to.equal('Rupert is walking... where\'s he off to?')
          expect(executionDescription.ctx.petDiary[6]).to.equal('Shh, Rupert is eating...')
          done()
        } catch (e) {
          done(e)
        }
      }
    )
  })

  it('should create a new Alan execution', function (done) {
    rest.postJson(
      executionsUrl,
      {
        stateMachineName: 'tymlyTest_listeningCat_1_0',
        input: {
          petName: 'Alan',
          gender: 'male',
          petDiary: []
        }
      },
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(201)
      expect(executionDescription.status).to.eql('RUNNING')
      expect(executionDescription.currentStateName).to.eql('WakingUp')
      expect(executionDescription.ctx.petName).to.eql('Alan')
      alan = executionDescription.executionName
      done()
    })
  })
  it('should wait a while', function (done) {
    setTimeout(done, 250)
  })

  it('should update Alan execution with a heartbeat', function (done) {
    rest.putJson(
      executionsUrl + '/' + alan,
      {
        action: 'SendTaskHeartbeat',
        output: {
          sound: 'Car engine'
        }
      },
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(200)
      expect(executionDescription.status).to.equal('RUNNING')
      expect(executionDescription.currentStateName).to.equal('Listening')
      expect(executionDescription.ctx.sound).to.equal('Car engine')
      done()
    })
  })

  it('should wait a while longer', function (done) {
    setTimeout(done, 250)
  })

  it('should sendTaskSuccess() to the Alan execution', function (done) {
    rest.putJson(
      executionsUrl + '/' + alan,
      {
        action: 'SendTaskSuccess',
        output: {
          order: [
            {
              product: 'Fresh Tuna',
              quantity: 25
            }
          ]
        }
      },
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(200)
      done()
    })
  })

  it('should successfully complete Alans\'s awakening', function (done) {
    statebox.waitUntilStoppedRunning(
      alan,
      function (err, executionDescription) {
        try {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('tymlyTest_listeningCat_1_0')
          expect(executionDescription.currentStateName).to.eql('Sleeping')
          expect(executionDescription.ctx.gender).to.eql('male')
          expect(executionDescription.ctx.petDiary).to.be.an('array')
          expect(executionDescription.ctx.petDiary[0]).to.equal('Look out, Alan is waking up!')
          expect(executionDescription.ctx.petDiary[1]).to.equal('Alan is listening for something... what will he hear?')
          expect(executionDescription.ctx.petDiary[2]).to.equal('Sweet dreams Alan! x')
          expect(executionDescription.ctx.formData.order[0]).to.eql(
            {
              product: 'Fresh Tuna',
              quantity: 25
            }
          )
          done()
        } catch (err) {
          done(err)
        }
      }
    )
  })

  it('should create another new Alan execution', function (done) {
    rest.postJson(
      executionsUrl,
      {
        stateMachineName: 'tymlyTest_listeningCat_1_0',
        input: {
          petName: 'Alan',
          gender: 'male',
          petDiary: []
        }
      },
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(201)
      expect(executionDescription.status).to.eql('RUNNING')
      expect(executionDescription.currentStateName).to.eql('WakingUp')
      expect(executionDescription.ctx.petName).to.eql('Alan')
      alan = executionDescription.executionName
      done()
    })
  })

  it('should cancel a new Alan tymly', function (done) {
    rest.del(
      executionsUrl + alan,
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(204)
      done()
    })
  })

  it('should get stopped Alan execution-description', function (done) {
    rest.get(
      executionsUrl + '/' + alan,
      sendToken(adminToken)
    ).on('complete', function (executionDescription, res) {
      expect(res.statusCode).to.equal(200)
      expect(executionDescription.ctx.petName).to.equal('Alan')
      expect(executionDescription.status).to.equal('STOPPED')
      expect(executionDescription.errorCode).to.equal('STOPPED')
      expect(executionDescription.errorCause).to.equal('Execution stopped externally')
      done()
    })
  })

  it('should get an admin\'s remit', function (done) {
    rest.get(remitUrl, sendToken(adminToken)).on('complete', function (remit, res) {
      expect(res.statusCode).to.equal(200)
      done()
    })
  })

  it('should get a normal user\'s remit', function (done) {
    rest.get(remitUrl, sendToken(irrelevantToken)).on('complete', function (remit, res) {
      expect(res.statusCode).to.equal(200)
      done()
    })
  })

  it('should start state machine to claim from an API (https://jsonplaceholder.typicode.com/posts) and expect the header to be taken through, and sensible data to be returned', function (done) {
    statebox.startExecution(
      {},
      GET_FROM_API_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        expect(err).to.eql(null)
        expect(executionDescription.ctx.result.Authorization).to.eql(process.env.TEST_TOKEN)
        expect(executionDescription.currentStateName).to.eql('GetDataFromRestApi')
        expect(executionDescription.stateMachineName).to.eql('tymlyTest_getFromApi_1_0')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done(err)
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
