/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('CQC tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const STATE_MACHINE_NAME = 'cqc_refreshFromCsvFile_1_0'

  let tymlyService
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
        tymlyService = tymlyServices.tymly
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

  it('should be the correct data in the database', function (done) {
    client.query(
      'select location_id, location_name, latest_rating ' +
      'from cqc.cqc ' +
      'order by location_id',
      function (err, result) {
        expect(err).to.eql(null)
        if (err) {
          console.error(err)
        } else {
          expect(result.rows).to.eql(
            [
              {
                'latest_rating': 'Good',
                'location_id': '1234567890',
                'location_name': 'Meadow Rose Nursing Home'
              },
              {
                'latest_rating': 'Good',
                'location_id': '12345678909',
                'location_name': 'Beverley Mews'
              },
              {
                'latest_rating': 'Good',
                'location_id': '1234567891',
                'location_name': 'MBI Home Care Ltd'
              },
              {
                'latest_rating': 'Good',
                'location_id': '1234567892',
                'location_name': 'Balm Care Services Limited'
              },
              {
                'latest_rating': 'Requires improvement',
                'location_id': '1234567893',
                'location_name': 'Care for You (UK) Limited'
              },
              {
                'latest_rating': 'Good',
                'location_id': '1234567894',
                'location_name': 'Bluebell Centre'
              },
              {
                'latest_rating': 'Good',
                'location_id': '1234567895',
                'location_name': 'Cygnet House'
              },
              {
                'latest_rating': 'Good',
                'location_id': '1234567896',
                'location_name': 'Ambleside'
              },
              {
                'latest_rating': 'Good',
                'location_id': '1234567897',
                'location_name': 'Ashley House'
              },
              {
                'latest_rating': 'Good',
                'location_id': '1234567898',
                'location_name': 'Ross Court Care Home'
              }
            ]
          )
          done()
        }
      }
    )
  })

  it('Should be clean up the database', function (done) {
    client.query(
      `DELETE FROM cqc.cqc WHERE location_id::text LIKE '123456789%';`,
      function (err, result) {
        expect(result.rowCount).to.eql(10)
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          done()
        }
      }
    )
  })

  it('Should find a now empty database', function (done) {
    client.query(
      'select * from cqc.cqc;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql([])
          done()
        }
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
