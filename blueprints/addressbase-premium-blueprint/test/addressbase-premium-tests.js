/* eslint-env mocha */
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

const tymly = require('tymly')
const path = require('path')
const fs = require('fs')
const expect = require('chai').expect

const STATE_MACHINE_NAME = 'ordnanceSurvey_importAddressbasePremiumGml_1_0'

describe('xmlFlatten State Resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const fixture = path.resolve(__dirname, 'fixtures')

  const sourceFile = path.resolve(fixture, 'input', 'exeter-extract.xml')
  const streetsFile = path.resolve(fixture, 'output', 'streets.csv')
  const streetsExpectedFile = path.resolve(fixture, 'expected', 'streets.csv')

  describe('blueprint', () => {
    let tymlyService
    let statebox

    it('start Tymly service', (done) => {
      tymly.boot(
        {
          pluginPaths: [
            path.resolve(__dirname, './../../../plugins/tymly-etl-plugin')
          ],
          blueprintPaths: [
            path.resolve(__dirname, './..')
          ]
        },
        (err, tymlyServices) => {
          if (err) return done(err)
          tymlyService = tymlyServices.tymly
          statebox = tymlyServices.statebox
          done()
        }
      )
    })

    it('run the execution to process the XML file', async () => {
      const executionDescription = await statebox.startExecution(
        {
          xmlPath: sourceFile,
          csvPath: streetsFile
        }, // input
        STATE_MACHINE_NAME, // state machine name
        {
          sendResponse: 'COMPLETE'
        } // options
      )

      expect(executionDescription.status).to.eql('SUCCEEDED')
      expect(executionDescription.currentStateName).to.eql('ExtractStreets')

      const output = fs.readFileSync(streetsFile, {encoding: 'utf8'}).split('\n')
      const expected = fs.readFileSync(streetsExpectedFile, {encoding: 'utf8'}).split('\n')

      expect(output).to.eql(expected)
    })

    it('shutdown Tymly', () => {
      return tymlyService.shutdown()
    })
  }) // blueprint
})
