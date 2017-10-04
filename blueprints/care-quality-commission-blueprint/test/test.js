/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('CQC tests', function () {
  this.timeout(15000)

  const STATE_MACHINE_NAME = 'cqc_refreshFromCsvFile_1_0'

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
                  location_id: '1-1004508435',
                  location_name: 'Meadow Rose Nursing Home',
                  latest_rating: 'Good'
                },
                {
                  location_id: '1-1010722651',
                  location_name: 'MBI Home Care Ltd',
                  latest_rating: 'Good'
                },
                {
                  location_id: '1-1011039037',
                  location_name: 'Balm Care Services Limited',
                  latest_rating: 'Good'
                },
                {
                  location_id: '1-1012933568',
                  location_name: 'Care for You (UK) Limited',
                  latest_rating: 'Requires improvement'
                },
                {
                  location_id: '1-1017570228',
                  location_name: 'Bluebell Centre',
                  latest_rating: 'Good'
                },
                {
                  location_id: '1-1028678661',
                  location_name: 'Cygnet House',
                  latest_rating: 'Good'
                },
                {
                  location_id: '1-1028986728',
                  location_name: 'Ambleside',
                  latest_rating: 'Good'
                },
                {
                  location_id: '1-1029431911',
                  location_name: 'Ashley House',
                  latest_rating: 'Good'
                },
                {
                  location_id: '1-1040494951',
                  location_name: 'Ross Court Care Home',
                  latest_rating: 'Good'
                },
                {
                  location_id: '1-1043708006',
                  location_name: 'Beverley Mews',
                  latest_rating: 'Good'
                }
              ]
            )
            done()
          }
        }
      )
  }
  )
})
