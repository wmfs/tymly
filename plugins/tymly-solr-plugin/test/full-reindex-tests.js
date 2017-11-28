/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const STATE_MACHINE_NAME = 'tymlyTest_fullReindex_1_0'

describe('tymly-solr-plugin full reindex tests', function () {
  this.timeout(5000)

  let statebox

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
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should start the state resource execution', function (done) {
    if (process.env.SOLR_URL) {
      statebox.startExecution(
        {},  // input
        STATE_MACHINE_NAME, // state machine name
        {
          sendResponse: 'COMPLETE'
        }, // options
        function (err, executionDescription) {
          expect(err).to.eql(null)
          console.log(JSON.stringify(executionDescription, null, 2))
          expect(executionDescription.currentStateName).to.eql('FullReindex')
          expect(executionDescription.currentResource).to.eql('module:fullReindex')
          expect(executionDescription.stateMachineName).to.eql(STATE_MACHINE_NAME)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          done()
        }
      )
    } else {
      done()
    }
  })
})
