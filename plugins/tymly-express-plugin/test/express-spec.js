/* eslint-env mocha */

'use strict'
const PORT = 3003
const jwt = require('jsonwebtoken')
const request = require('request')
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
    Accept: '*/*'
  }
  if (adminToken) {
    options.authorization = 'Bearer ' + adminToken
  }
  return options
}

describe('Simple Express tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, server, adminToken, irrelevantToken, rupert, alan, statebox
  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'
  const executionsUrl = `http://localhost:${PORT}/executions/`
  const remitUrl = `http://localhost:${PORT}/remit/`
  const GET_FROM_API_STATE_MACHINE = 'tymlyTest_getFromApi_1_0'

  it('should create a usable admin token for Dave', () => {
    adminToken = jwt.sign(
      {},
      new Buffer(secret, 'base64'),
      {
        subject: 'Dave',
        audience: audience
      }
    )
  })

  it('should create a usable token for Steve', () => {
    irrelevantToken = jwt.sign(
      {},
      new Buffer(secret, 'base64'),
      {
        subject: 'Steve',
        audience: audience
      }
    )
  })

  it('should create some basic tymly services to run a simple cat blueprint', (done) => {
    process.env.TEST_API_URL = remitUrl
    process.env.TEST_TOKEN = 'Bearer ' + adminToken

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
      (err, tymlyServices) => {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        server = tymlyServices.server
        statebox = tymlyServices.statebox
        tymlyServices.rbac.rbac.debug()
        done()
      }
    )
  })

  it('should start Express app', (done) => {
    server.listen(
      PORT,
      () => {
        console.log('\n')
        console.log(`Example app listening on port ${PORT}!\n`)
        done()
      }
    )
  })

  // CHECK THAT A VALID JWT REQUIRED TO USE /TYMLY'S API
  // ---------------------------------------------------

  it('should fail to create a new Tymly without a JWT', (done) => {
    request(
      {
        url: executionsUrl,
        method: 'POST',
        json: {
          stateMachineName: 'tymlyTest_cat_1_0',
          data: {petName: 'Rupert'}
        }
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(401)
        done(err)
      })
  })

  it('should fail updating a Tymly without a JWT', (done) => {
    request(
      {
        url: executionsUrl + alan,
        method: 'PUT',
        json: {
          action: 'SendTaskHeartbeat',
          output: {
            sound: 'Car engine'
          }
        }
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(401)
        done(err)
      })
  })

  it('should fail getting a Tymly without a JWT', (done) => {
    request(
      {
        url: executionsUrl + rupert,
        method: 'GET'
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(401)
        done(err)
      }
    )
  })

  it('should fail getting the user\'s remit without a JWT', (done) => {
    request(
      {
        url: remitUrl,
        method: 'GET'
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(401)
        done(err)
      }
    )
  })

  // VALID JWTs SHOULD WORK
  // ----------------------
  it('should create a new Rupert execution', (done) => {
    request(
      {
        url: executionsUrl,
        method: 'POST',
        json: {
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
        headers: sendToken(adminToken)
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(201)
        expect(body.status).to.eql('RUNNING')
        expect(body.currentStateName).to.eql('WakingUp')
        expect(body.ctx.petName).to.eql('Rupert')
        expect(body.executionOptions).to.eql(
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
        rupert = body.executionName
        done(err)
      }
    )
  })

  it('should get Rupert execution description', (done) => {
    request(
      {
        url: executionsUrl + rupert,
        method: 'GET',
        headers: sendToken(adminToken),
        json: true
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(200)
        expect(body.ctx.petName).to.equal('Rupert')
        done(err)
      }
    )
  })

  it('should successfully complete Rupert\'s day', (done) => {
    statebox.waitUntilStoppedRunning(
      rupert,
      (err, executionDescription) => {
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

  it('should create a new Alan execution', (done) => {
    request(
      {
        url: executionsUrl,
        method: 'POST',
        json: {
          stateMachineName: 'tymlyTest_listeningCat_1_0',
          input: {
            petName: 'Alan',
            gender: 'male',
            petDiary: []
          }
        },
        headers: sendToken(adminToken)
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(201)
        expect(body.status).to.eql('RUNNING')
        expect(body.currentStateName).to.eql('WakingUp')
        expect(body.ctx.petName).to.eql('Alan')
        alan = body.executionName
        done(err)
      }
    )
  })

  it('should wait a while', (done) => {
    setTimeout(done, 250)
  })

  it('should update Alan execution with a heartbeat', (done) => {
    request(
      {
        url: executionsUrl + alan,
        method: 'PUT',
        json: {
          action: 'SendTaskHeartbeat',
          output: {
            sound: 'Car engine'
          }
        },
        headers: sendToken(adminToken)
      },
      (err, res, body) => {
        console.log('>>>>', res)
        expect(res.statusCode).to.equal(200)
        expect(body.status).to.equal('RUNNING')
        expect(body.currentStateName).to.equal('Listening')
        expect(body.ctx.sound).to.equal('Car engine')
        done(err)
      }
    )
  })

  it('should wait a while longer', (done) => {
    setTimeout(done, 250)
  })

  it('should sendTaskSuccess() to the Alan execution', (done) => {
    request(
      {
        url: executionsUrl + alan,
        method: 'PUT',
        json: {
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
        headers: sendToken(adminToken)
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(200)
        done(err)
      }
    )
  })

  it('should successfully complete Alans\'s awakening', (done) => {
    statebox.waitUntilStoppedRunning(
      alan,
      (err, executionDescription) => {
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

  it('should create another new Alan execution', (done) => {
    request(
      {
        url: executionsUrl,
        method: 'POST',
        json: {
          stateMachineName: 'tymlyTest_listeningCat_1_0',
          input: {
            petName: 'Alan',
            gender: 'male',
            petDiary: []
          }
        },
        headers: sendToken(adminToken)
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(201)
        expect(body.status).to.eql('RUNNING')
        expect(body.currentStateName).to.eql('WakingUp')
        expect(body.ctx.petName).to.eql('Alan')
        alan = body.executionName
        done(err)
      }
    )
  })

  it('should cancel a new Alan tymly', (done) => {
    request(
      {
        url: executionsUrl + alan,
        method: 'DELETE',
        headers: sendToken(adminToken)
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(204)
        done(err)
      }
    )
  })

  it('should get stopped Alan execution-description', (done) => {
    request(
      {
        url: executionsUrl + alan,
        method: 'GET',
        headers: sendToken(adminToken),
        json: true
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(200)
        expect(body.ctx.petName).to.equal('Alan')
        expect(body.status).to.equal('STOPPED')
        expect(body.errorCode).to.equal('STOPPED')
        expect(body.errorCause).to.equal('Execution stopped externally')
        done(err)
      }
    )
  })

  it('should get an admin\'s remit', (done) => {
    request(
      {
        url: remitUrl,
        method: 'GET',
        headers: sendToken(adminToken),
        json: true
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(200)
        done(err)
      }
    )
  })

  it('should get a normal user\'s remit', (done) => {
    request(
      {
        url: remitUrl,
        method: 'GET',
        headers: sendToken(irrelevantToken),
        json: true
      },
      (err, res, body) => {
        expect(res.statusCode).to.equal(200)
        done(err)
      }
    )
  })

  it('should start state machine to claim from an API (our localhost booted address [remit]) and expect the header to be taken through, and sensible data to be returned', (done) => {
    statebox.startExecution(
      {},
      GET_FROM_API_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        expect(err).to.eql(null)
        console.log(executionDescription)
        expect(executionDescription.currentStateName).to.eql('GetDataFromRestApi')
        expect(executionDescription.stateMachineName).to.eql('tymlyTest_getFromApi_1_0')
        expect(executionDescription.ctx.result.stateMachinesUserCanStart)
        expect(executionDescription.ctx.result.forms)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done(err)
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
