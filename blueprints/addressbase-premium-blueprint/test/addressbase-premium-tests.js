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

describe('process addressbase-premium', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const fixture = path.resolve(__dirname, 'fixtures')

  const sourceFile = path.resolve(fixture, 'input', 'exeter-extract.xml')
  const streetsFile = path.resolve(fixture, 'output', 'streets.csv')
  const streetsExpectedFile = path.resolve(fixture, 'expected', 'streets.csv')
  const propertyFile = path.resolve(fixture, 'output', 'property.csv')
  const propertyExpectedFile = path.resolve(fixture, 'expected', 'property.csv')

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
          streets: {
            xmlPath: sourceFile,
            csvPath: streetsFile
          },
          property: {
            xmlPath: sourceFile,
            csvPath: propertyFile
          }
        }, // input
        STATE_MACHINE_NAME, // state machine name
        {
          sendResponse: 'COMPLETE'
        } // options
      )
      expect(executionDescription.status).to.eql('SUCCEEDED')

      const streets = fs.readFileSync(streetsFile, {encoding: 'utf8'}).split('\n')
      const streetsExpected = fs.readFileSync(streetsExpectedFile, {encoding: 'utf8'}).split('\n')
      expect(streets).to.eql(streetsExpected)

      const property = fs.readFileSync(propertyFile, {encoding: 'utf8'}).split('\n')
      const propertyExpected = fs.readFileSync(propertyExpectedFile, {encoding: 'utf8'}).split('\n')
      expect(property).to.eql(propertyExpected)
    })

    it('shutdown Tymly', () => {
      return tymlyService.shutdown()
    })
  }) // blueprint
})
