/* eslint-env mocha */

'use strict'

const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect

describe('data import', function () {
  this.timeout(5000)

  const STATE_MACHINE_NAME = 'wmfs_refreshFromCsvFile_1_0'

  let statebox
  let client

  it('should startup flobot', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          require.resolve('flobot-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        statebox = flobotServices.statebox
        client = flobotServices.storage.client
        done()
      }
    )
  })

  it('should create and populate the wmfs.fire_safety database table', function (done) {
    statebox.startExecution(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input')
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.eql('ImportingCsvFiles')
        done()
      }
    )
  })

  it('Should be the correct data in the database', function (done) {
    client.query(
      'select uprn, fs_management, last_enforcement, building_regs_ignored from wmfs.fire_safety order by uprn;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql(
            [
              {uprn: '20815', fs_management: 4, last_enforcement: 4, building_regs_ignored: 'N'},
              {uprn: '21484', fs_management: 1, last_enforcement: 6, building_regs_ignored: 'Y'},
              {uprn: '10014008879', fs_management: 1, last_enforcement: 1, building_regs_ignored: 'Y'},
              {uprn: '10033912337', fs_management: 2, last_enforcement: 2, building_regs_ignored: 'N'},
              {uprn: '100071414995', fs_management: 3, last_enforcement: 3, building_regs_ignored: 'Y'},
              {uprn: '100071448271', fs_management: 0, last_enforcement: 0, building_regs_ignored: 'Y'},
              {uprn: '100071449927', fs_management: 5, last_enforcement: 5, building_regs_ignored: 'N'}
            ]
          )
          done()
        }
      }
    )
  })
})
