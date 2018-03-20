/* eslint-env mocha */
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

const tymly = require('tymly')
const path = require('path')
const fs = require('fs')
const expect = require('chai').expect
const FlattenXmlFiles = require('./../lib/components/state-resources/flatten-xml-files')

const STATE_MACHINE_NAME = 'tymlyTest_simpsonsImport_1_0'

describe('xmlFlatten State Resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const fixture = path.resolve(__dirname, 'fixtures', 'xmlflatten')

  const sourceFile = path.resolve(fixture, 'input', 'simpsons.xml')
  const expectedFile = path.resolve(fixture, 'expected', 'simpsons.csv')

  function outputFileName (postfix) {
    const outputFile = path.resolve(fixture, 'output', `simpsons-${postfix}.csv`)

    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile)

    return outputFile
  } // outputFileName

  function verifyOutput (outputFile, done) {
    try {
      const output = fs.readFileSync(outputFile, {encoding: 'utf8'}).split('\n')
      const expected = fs.readFileSync(expectedFile, {encoding: 'utf8'}).split('\n')

      expect(output).to.eql(expected)
    } catch (err) {
      if (done) return done(err)
      throw err
    }
  } // verifyOutput

  describe('state resource', () => {
    const flattener = new FlattenXmlFiles()
    it('initialise flattenXml state resource', (done) => {
      flattener.init({
        rootXMLElement: 'Episode',
        pivotPath: '$.People.Person',
        headerMap: [
          ['$.Title', 'title', 'string'],
          ['@.Name', 'name', 'string'],
          [{'test': '@.Age<=16', 'value': 'yes'}, 'child', 'string'],
          [{'test': '@.Age>16', 'select': '@.Age'}, 'age', 'integer']
        ]
      },
      null,
      done)
    })

    it('run flattenXml state resource', (done) => {
      const outputFile = outputFileName('state-resource')

      flattener.run({
        xmlPath: sourceFile,
        csvPath: outputFile
      },
      {
        sendTaskSuccess: () => {
          verifyOutput(outputFile, done)
          done()
        },
        sendTaskFailure: err => done(err)
      })
    })
  }) // state-resource

  describe('blueprint', () => {
    let tymlyService
    let statebox

    it('start Tymly service', (done) => {
      tymly.boot(
        {
          pluginPaths: [
            path.resolve(__dirname, './../lib')
          ],
          blueprintPaths: [
            path.resolve(fixture, 'blueprints', 'xmlflatten-blueprint')
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
      const outputFile = outputFileName('execution')

      const executionDescription = await statebox.startExecution(
        {
          xmlPath: sourceFile,
          csvPath: outputFile
        }, // input
        STATE_MACHINE_NAME, // state machine name
        {
          sendResponse: 'COMPLETE'
        } // options
      )

      expect(executionDescription.status).to.eql('SUCCEEDED')
      expect(executionDescription.currentStateName).to.eql('FlattenXmlFile')

      verifyOutput(outputFile)
    })

    it('shutdown Tymly', () => {
      return tymlyService.shutdown()
    })
  }) // blueprint
})
