/* eslint-env mocha */

'use strict'

const debug = require('debug')('supercopy')
const path = require('path')
const fs = require('fs')
const expect = require('chai').expect
const convertToCsv = require('../lib/convert-to-csv.js')
const supercopy = require('../lib/index.js')
const pg = require('pg')
const sqlScriptRunner = require('./fixtures/sql-script-runner')

describe('Supercopy data from an xml file', () => {
  const connectionString = process.env.PG_CONNECTION_STRING
  let client

  it('Should load some test data', (done) => {
    client = new pg.Client(connectionString)
    client.connect()

    sqlScriptRunner(
      [
        'uninstall.sql',
        'install.sql'
      ],
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('convert XML file to a CSV file', (done) => {
    let xmlPath = path.join(__dirname, 'fixtures', 'input-data', 'establishment.xml')
    let csvPath = path.join(__dirname, 'output', 'establishment.csv')
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath)
    }

    convertToCsv('EstablishmentDetail', xmlPath, csvPath, () => {
      expect(fs.existsSync(csvPath)).to.equal(true)
      expect(fs.statSync(csvPath).size).to.not.equal(0)

      const wholeFile = fs.readFileSync(csvPath, 'utf-8')
      const lines = wholeFile.split('\n')
      expect(lines.length).to.equal(5)

      expect(lines[0].startsWith('FHRSID,LocalAuthorityBusinessID')).to.equal(true)
      expect(lines[1].startsWith('584976,32556')).to.equal(true)

      done()
    })
  })

  it('Should supercopy some people with XML conversion', (done) => {
    supercopy(
      {
        sourceDir: path.resolve(__dirname, './output/establishment'),
        topDownTableOrder: ['adults', 'children'],
        headerColumnNamePkPrefix: '.',
        client: client,
        schemaName: 'supercopy_test',
        debug: true,
        truncateFirstTables: true,
        triggerElement: 'EstablishmentDetail',
        xmlSourceFile: path.resolve(__dirname, './fixtures/input-data/establishment.xml')
      },
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('Should return correctly populated rows', (done) => {
    client.query(
      'select fhrsid, businessname from supercopy_test.establishment order by fhrsid',
      function (err, result) {
        if (err) {
          debug('err', err)
        }
        expect(err).to.equal(null)
        expect(result.rowCount).to.eql(3)
        done()
      }
    )
  })

  it('Cleanup test data', (done) => {
    client = new pg.Client(connectionString)
    client.connect()

    sqlScriptRunner(
      [
        'uninstall.sql'
      ],
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })
})
