/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('Ofsted tests', function () {
  this.timeout(5000)

  const STATE_MACHINE_NAME = 'wmfs_refreshFromCsvFile_1_0'

  let statebox
  let client

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        done()
      }
    )
  })

  it('should execute importingCsvFiles', function (done) {
    statebox.startExecution(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input')
      },
      STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.equal('ImportingCsvFiles')
        done()
      }
    )
  })

  it('Should be the correct data in the database', function (done) {
    client.query(
      'select urn, school_name from wmfs.ofsted order by urn;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql(
            [
              {
                urn: '103120',
                school_name: 'XXX'
              }
            ]
          )
          done()
        }
      }
    )
  })
})
