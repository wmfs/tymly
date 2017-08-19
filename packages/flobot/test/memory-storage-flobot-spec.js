/* eslint-env mocha */

const expect = require('chai').expect
const flobot = require('../lib')
const path = require('path')

describe('Memory flobot-storage tests', function () {
  this.timeout(5000)

  let flobotsService

  it('should create some out-the-box flobot services to test memory storage', function (done) {
    flobot.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/storage-blueprint')
        ]
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        flobotsService = flobotServices.flobots
        done()
      }
    )
  })

  it('should find the simple-storage flow by id', function () {
    flobotsService.findFlowById('fbotTest_simpleStorage_1_0',
      function (err, flow) {
        expect(err).to.eql(null)
        expect(flow.flowId).to.eql('fbotTest_simpleStorage_1_0')
      }
    )
  })

  it('should start (and complete) a simple-storage Flobot', function (done) {
    flobotsService.startNewFlobot(
      'fbotTest_simpleStorage_1_0',
      {
        instigatingClient: {

        },
        data: {
          catDocFromParams: {
            'name': 'Rupert',
            'size': 'large',
            'comment': 'Stunning.'
          }
        }
      },
      function (err, rupertStorageFlobot) {
        expect(err).to.eql(null)
        expect(rupertStorageFlobot.flobotId).to.be.a('string')
        expect(rupertStorageFlobot.flowId).to.eql('fbotTest_simpleStorage_1_0')
        expect(rupertStorageFlobot.ctx.catDocFromStorage.name).to.eql('Rupert')
        expect(rupertStorageFlobot.ctx.catDocFromStorage.size).to.eql('large')
        expect(rupertStorageFlobot.ctx.catDocFromStorage.comment).to.eql('Stunning.')
        expect(rupertStorageFlobot.stateId).to.eql('findingOne')
        expect(rupertStorageFlobot.status).to.eql('finished')
        done()
      }
    )
  })
})
