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

  const inputDir = path.resolve(fixture, 'input')
  const outputDir = path.resolve(fixture, 'output')
  const flattenedDir = path.resolve(outputDir, 'flattened')

  const expectedDir = path.resolve(fixture, 'expected')

  const sourceFile = path.resolve(inputDir, 'exeter-extract.xml')
  const streetsFile = path.resolve(flattenedDir, 'streets.csv')
  const streetsExpectedFile = path.resolve(expectedDir, 'streets.csv')
  const propertyFile = path.resolve(flattenedDir, 'property.csv')
  const propertyExpectedFile = path.resolve(expectedDir, 'property.csv')
  const upsertsExpectedFile = path.resolve(outputDir, 'upserts', 'addressbase_premium_holding.csv')

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  describe('blueprint', () => {
    let tymlyService
    let statebox
    let client

    it('start Tymly service', (done) => {
      tymly.boot(
        {
          pluginPaths: [
            path.resolve(__dirname, './../../../plugins/tymly-etl-plugin'),
            path.resolve(__dirname, './../../../plugins/tymly-pg-plugin')
          ],
          blueprintPaths: [
            path.resolve(__dirname, './..'),
            path.resolve(__dirname, './fixtures/test-blueprint')
          ]
        },
        (err, tymlyServices) => {
          if (err) return done(err)
          tymlyService = tymlyServices.tymly
          statebox = tymlyServices.statebox
          client = tymlyServices.storage.client
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
            csvPath: propertyFile,
            sourceFilePaths: [ propertyFile ],
            outputDirRootPath: outputDir,
            outputDir: outputDir
          }
        }, // input
        STATE_MACHINE_NAME, // state machine name
        {
          sendResponse: 'COMPLETE'
        } // options
      )
      expect(executionDescription.status).to.eql('SUCCEEDED')
    })

    it('verify the flattened csv outout', () => {
      const streets = fs.readFileSync(streetsFile, {encoding: 'utf8'}).split('\n')
      const streetsExpected = fs.readFileSync(streetsExpectedFile, {encoding: 'utf8'}).split('\n')
      expect(streetsExpected).to.eql(streets)

      const property = fs.readFileSync(propertyFile, {encoding: 'utf8'}).split('\n')
      const propertyExpected = fs.readFileSync(propertyExpectedFile, {encoding: 'utf8'}).split('\n')
      expect(propertyExpected).to.eql(property)
    })

    it('verify the smithereens output', () => {
      const property = fs.readFileSync(propertyFile, {encoding: 'utf8'}).split('\n')
        .map(line => line.replace(/"/g, '')) // strip quote marks
        .map(line => stripColumn(line, 4)) // strip changeState marker

      const upsertExpected = fs.readFileSync(upsertsExpectedFile, {encoding: 'utf8'}).split('\r\n')
        .map(line => stripColumn(line, 1)) // strip hashsum

      expect(upsertExpected).to.eql(property)
    })

    it('verify the database import', async () => {
      const propertyLpis = fs.readFileSync(propertyFile, {encoding: 'utf8'}).split('\n')
        .map(line => line.split(',')[0]) // extract LPI
        .slice(1, -1) // drop header line, and empty last line
        .map(line => line.replace(/"/g, '')) // strip quote marks
        .sort()

      const importLpis = (await client.query('SELECT lpi_key FROM ordnance_survey.addressbase_premium_holding ORDER BY lpi_key ASC;'))
        .rows.map(row => row.lpi_key)

      expect(importLpis).to.eql(propertyLpis)
    })

    it('shutdown Tymly', () => {
      return tymlyService.shutdown()
    })
  }) // blueprint

  function stripColumn (line, index) {
    const cols = line.split(',')
    cols.splice(index, 1)
    return cols.join()
  }
})
