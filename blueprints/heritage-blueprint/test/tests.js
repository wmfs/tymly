/* eslint-env mocha */

'use strict'

const chai = require('./../node_modules/chai')
const expect = chai.expect
const path = require('path')
const flobot = require('flobot')

describe('Heritage tests', function () {
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
      'select uprn, address, info from wmfs.heritage order by uprn;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql(
            [
              {
                uprn: '100032033430',
                address: 'BLAKELANDS COUNTRY GUEST HOUSE & RESTAURANT, SIX ASHES ROAD, HALFPENNY GREEN, STOURBRIDGE, DY7 5DP',
                info: 'Grade 2* listed.'
              },
              {
                uprn: '100071312158',
                address: 'FOX HILL HOUSE, FOX HILL ROAD, LITTLE SUTTON, SUTTON COLDFIELD, B75 6NY',
                info: 'Heritage Site'
              },
              {
                uprn: '100071384631',
                address: '31 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '100071384632',
                address: '33 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '100071384633',
                address: '35 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '100071384634',
                address: '37 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '100071384635',
                address: '39-45 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '100071384636',
                address: '47 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '100071384637',
                address: 'FIRST FLOOR, 49-51 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '100071384638',
                address: 'BAGUETTE DU MAISON, 49-51 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '100071411786',
                address: 'FIRST TO THIRD FLOORS, 33 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '100071411787',
                address: 'FIRST FLOOR AND SECOND FLOOR, 35 CONSTITUTION HILL, HOCKLEY, BIRMINGHAM, B19 3LE',
                info: 'Heritage Site'
              },
              {
                uprn: '200004531516',
                address: 'PATSHULL HALL, PATSHULL PARK, WOLVERHAMPTON, WV6 7HY',
                info: ' Grade I listed building be renovated.'
              }
            ]
          )
          done()
        }
      }
    )
  })
})
