/* eslint-env mocha */

'use strict'

const jwt = require('jsonwebtoken')
const rest = require('restler')
const expect = require('chai').expect
const flobot = require('flobot')
const path = require('path')
const formsPluginDir = require.resolve('flobot-forms-plugin')

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
  this.timeout(5000)

  let app
  let adminToken
  let irrelevantToken
  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'
  const flobotsUrl = 'http://localhost:3000/flobots/'
  const remitUrl = 'http://localhost:3000/remit/'
  let rupertFlobotId
  let alanFlobotId
  const Buffer = require('safe-buffer').Buffer

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

  it('should create some basic flobot services to run a simple cat blueprint', function (done) {
    flobot.boot(
      {

        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          formsPluginDir,
          path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        ],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
        ],

        config: {

          staticRootDir: path.resolve(__dirname, './output'),

          auth: {
            secret: secret,
            audience: audience
          },

          defaultUsers: {
            'Dave': ['fbotTest_fbotTestAdmin'],
            'Steve': ['spaceCadet']
          }

        }

      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        app = flobotServices.server.app
        flobotServices.rbac.rbac.debug()
        done()
      }
    )
  })

  it('should start Express app', function (done) {
    app.listen(3000, function () {
      console.log('\n')
      console.log('Example app listening on port 3000!\n')
      done()
    })
  })

  // CHECK THAT A VALID JWT REQUIRED TO USE /flobots API
  // ---------------------------------------------------

  it('should fail to create a new Flobot without a JWT', function (done) {
    rest.postJson(
      flobotsUrl,
      {
        namespace: 'fbot',
        flowName: 'cat',
        version: '1.0',
        data: {petName: 'Rupert'}
      }).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(401)
        done()
      })
  })

  it('should fail updating a Flobot without a JWT', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'stretch'}).on('complete', function (badFlobot, res) {
        expect(res.statusCode).to.equal(401)
        done()
      })
  })

  it('should fail getting a Flobot without a JWT', function (done) {
    rest.get(flobotsUrl + rupertFlobotId).on('complete', function (badFlobot, res) {
      expect(res.statusCode).to.equal(401)
      done()
    })
  })

  it("should fail getting the user's remit without a JWT", function (done) {
    rest.get(remitUrl).on('complete', function (remit, res) {
      expect(res.statusCode).to.equal(401)
      done()
    })
  })

  // VALID JWTs SHOULD WORK
  // ----------------------
  it('should create a new Rupert flobot', function (done) {
    rest.postJson(
      flobotsUrl,
      {
        namespace: 'fbotTest',
        flowName: 'cat',
        version: '1.0',
        data: {petName: 'Rupert'}
      }, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(201)
        expect(rupert.flobot.flobotId).to.be.a('string')
        expect(rupert.flobot.flowId).to.eql('fbotTest_cat_1_0')
        expect(rupert.flobot.ctx.petName).to.be.eql('Rupert')
        expect(rupert.flobot.stateId).to.eql('sleeping')
        expect(rupert.flobot.stateEnterTime).to.be.a('string')
        rupertFlobotId = rupert.flobot.flobotId
        done()
      })
  })

  it('should transition Rupert to sitting', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'stretch'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('sitting')
        done()
      })
  })

  it("should tranistion to walking (because we explicitly took the 'thingsToDo' event)", function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'thingsToDo'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('walking')
        done()
      })
  })

  it("should transition Rupert back to sitting (auto-pick the 'stop' event)", function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('sitting')
        done()
      })
  })

  it('should fail to transition Rupert away from sitting (no implicit event to infer)', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {}, sendToken(adminToken)).on('complete', function (err, res) {
        expect(res.statusCode).to.equal(500)
        expect(err.error).to.eql('Internal Server Error')
        done()
      })
  })

  it('should fail to transition Rupert due to trying an unknown event', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'needThatCatnip'}, sendToken(adminToken)).on('complete', function (err, res) {
        expect(res.statusCode).to.equal(500)
        expect(err.error).to.eql('Internal Server Error')
        done()
      })
  })

  it('should see Rupert eating Meal #1... an automated and uninterruptible process. Should be purring at the end.', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'hungry'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('purring')
        done()
      })
  })

  it('should see Rupert going for meal #2 and still be purring by the end of it.', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'hungry'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('purring')
        done()
      })
  })

  it('should see Rupert moaning at the end of Meal #3.', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'hungry'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('moaning')
        done()
      })
  })

  it('should see a moaning Rupert stropping-off to the litter box', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'stropOff', data: {destination: 'litter box'}}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('walking')
        done()
      })
  })

  it('should have Rupert sitting again', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'stop'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('sitting')
        done()
      })
  })

  it('should have Rupert pooing', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'squat'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('pooing')
        done()
      })
  })

  it('should have Rupert sitting again', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'smugness'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('sitting')
        done()
      })
  })

  it('should go back to sleep', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'allTooMuch'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('running')
        expect(rupert.flobot.stateId).to.eql('sleeping')
        done()
      })
  })

  it('should get a sleeping Rupert', function (done) {
    rest.get(flobotsUrl + rupertFlobotId, sendToken(adminToken)).on('complete', function (rupert, res) {
      expect(res.statusCode).to.equal(200)
      expect(rupert.flobot.status).to.be.eql('running')
      expect(rupert.flobot.stateId).to.eql('sleeping')
      done()
    })
  })

  it('should fail getting an unknown cat', function (done) {
    rest.get(flobotsUrl + 'BADKITTY', sendToken(adminToken)).on('complete', function (err, res) {
      expect(res.statusCode).to.equal(404)
      expect(err.error).to.eql('Not Found')
      expect(err.message).to.eql("No flobot with id 'BADKITTY' could be found.")
      done()
    })
  })

  it('should finish with Rupert retiring for the evening', function (done) {
    rest.putJson(
        flobotsUrl + rupertFlobotId,
      {eventId: 'turnIn'}, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(200)
        expect(rupert.flobot.status).to.be.eql('finished')
        expect(rupert.flobot.stateId).to.eql('retiring')
        done()
      })
  })

  it("should fail getting Rupert, now that he's retired for the evening", function (done) {
    rest.get(flobotsUrl + rupertFlobotId, sendToken(adminToken)).on('complete', function (err, res) {
      expect(res.statusCode).to.equal(404)
      expect(err.error).to.eql('Not Found')
      expect(err.message).to.be.a('string')
      done()
    })
  })

  it('should create a new Alan flobot', function (done) {
    rest.postJson(
      flobotsUrl,
      {
        namespace: 'fbotTest',
        flowName: 'cat',
        version: '1.0',
        data: {petName: 'Alan'}
      }, sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(201)
        expect(rupert.flobot.ctx.petName).to.be.eql('Alan')
        alanFlobotId = rupert.flobot.flobotId
        done()
      })
  })

  it('should cancel a new Alan flobot', function (done) {
    rest.del(
        flobotsUrl + alanFlobotId,
      sendToken(adminToken)).on('complete', function (rupert, res) {
        expect(res.statusCode).to.equal(204)
        done()
      })
  })

  it("should fail getting Alan, now that he's been cancelled", function (done) {
    rest.get(flobotsUrl + alanFlobotId, sendToken(adminToken)).on('complete', function (err, res) {
      expect(res.statusCode).to.equal(404)
      expect(err.error).to.eql('Not Found')
      expect(err.message).to.be.a('string')
      done()
    })
  })

  it('should fail to create a new Rupert flobot (irrelevant roles)', function (done) {
    rest.postJson(
      flobotsUrl,
      {
        namespace: 'fbotTest',
        flowName: 'cat',
        version: '1.0',
        data: {petName: 'Rupert'}
      }, sendToken(irrelevantToken)).on('complete', function (err, res) {
        console.log(err)
        expect(res.statusCode).to.equal(403)
        expect(err.error).to.equal('Forbidden')
        expect(err.message).to.equal('No roles permit this action')
        done()
      })
  })

  // GET USER'S "REMIT"
  // ------------------

  it("should get the user's remit", function (done) {
    rest.get(remitUrl, sendToken(adminToken)).on('complete', function (remit, res) {
      expect(res.statusCode).to.equal(200)
      done()
    })
  })
})
