/* eslint-env mocha */
const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const reindexTests = [
  {
    name: 'delta reindex',
    stateName: 'DeltaReindex',
    resource: 'module:deltaReindex',
    stateMachine: 'tymlyTest_deltaReindex_1_0'
  },
  {
    name: 'full reindex',
    stateName: 'FullReindex',
    resource: 'module:fullReindex',
    stateMachine: 'tymlyTest_fullReindex_1_0'
  }
]

for (const test of reindexTests) {
  describe(`tymly-solr-plugin ${test.name} tests`, function () {
    this.timeout(process.env.TIMEOUT || 5000)

    let statebox, tymlyService, client

    it('should run the tymly services', function (done) {
      tymly.boot(
        {
          pluginPaths: [
            path.resolve(__dirname, './../lib'),
            require.resolve('tymly-pg-plugin')
          ],
          blueprintPaths: [
            path.resolve(__dirname, './fixtures/school-blueprint')
          ],
          config: {
            solrSchemaFields: [
              'id',
              'actorName',
              'characterName'
            ]
          }
        },
        function (err, tymlyServices) {
          expect(err).to.eql(null)
          tymlyService = tymlyServices.tymly
          statebox = tymlyServices.statebox
          client = tymlyServices.storage.client
          done()
        }
      )
    })

    it(`should start the ${test.stateMachine} state machine`, function (done) {
      statebox.startExecution(
        {}, // input
        test.stateMachine, // state machine name
        {
          sendResponse: 'COMPLETE'
        }, // options
        function (err, executionDescription) {
          try {
            expect(err).to.eql(null)
            expect(executionDescription.currentStateName).to.eql(test.stateName)
            expect(executionDescription.currentResource).to.eql(test.resource)
            expect(executionDescription.stateMachineName).to.eql(test.stateMachine)
            expect(executionDescription.status).to.eql('SUCCEEDED')
            done()
          } catch (e) {
            done(e)
          }
        }
      )
    })

    it('should cleanup test resources', (done) => {
      sqlScriptRunner(
        './db-scripts/cleanup.sql',
        client,
        (err) => {
          expect(err).to.equal(null)
          done(err)
        }
      )
    })

    it('should shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })
  })
}
