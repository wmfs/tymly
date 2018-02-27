/* eslint-env mocha */
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

const tymly = require('tymly')
const path = require('path')
const fs = require('fs')
const expect = require('chai').expect

const STATE_MACHINE_NAME = 'tymlyTest_simpsonsImport_1_0'

describe('xmlFlatten State Resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService
  let statebox

  const fixture = path.resolve(__dirname, 'fixtures', 'xmlflatten')

  it('start Tymly service', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/xmlflatten/blueprints/xmlflatten-blueprint')
        ]
      },
      function (err, tymlyServices) {
        if (err) return done(err)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('run the execution to process the XML file', async () => {
    const sourceFile = path.resolve(fixture, 'input', 'simpsons.xml')
    const outputFile = path.resolve(fixture, 'output', 'simpsons.csv')
    const expectedFile = path.resolve(fixture, 'expected', 'simpsons.csv')

    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile)

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

    const output = fs.readFileSync(outputFile, { encoding: 'utf8' }).split('\n')
    const expected = fs.readFileSync(expectedFile, { encoding: 'utf8' }).split('\n')

    expect(output).to.eql(expected)
  })

  it('shutdown Tymly', () => {
    return tymlyService.shutdown()
  })
})
