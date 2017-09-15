/* eslint-env mocha */

'use strict'

const process = require('process')
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const expect = require('chai').expect
const pg = require('pg')
const supercopy = require('./../lib')
const path = require('path')
const fs = require('fs')
const converter = require('converter')

describe('Run some basic tests', function () {
  const connectionString = process.env.PG_CONNECTION_STRING
  let client

  it('Should create a new pg client', function () {
    client = new pg.Client(connectionString)
    client.connect()
  })

  it('Should initially drop-cascade the pg_model_test schema, if one exists', function (done) {
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

  it('Should check to see if any XML files are present within the input files', function (done) {
    if (fs.existsSync(__dirname + '/fixtures/examples/people.xml')){
      console.log('FOUND SOME XML BOYS')
      done()
    } else {
      console.log('DIDNT FIND ANY XML BOYS')
      done()
    }
  })

  it('If XML found should convert to CSV and place within "inserts" subdir', function (done){
    console.log('*****printing to' + __dirname + '/fixtures/examples/people.xml')
    let reader = fs.createReadStream(__dirname + '/fixtures/examples/people.xml')
    let writer = fs.createWriteStream(__dirname + '/fixtures/examples/output.csv')
    let options = {
      from: 'xml',
      to: 'csv'
    }
    let convert = converter(options)
    reader.pipe(convert).pipe(writer)
    done()
  })

  it('Should supercopy some people', function (done) {
    supercopy(
      {
        sourceDir: path.resolve(__dirname, './fixtures/examples/people'),
        topDownTableOrder: ['children', 'adults'],
        headerColumnNamePkPrefix: '.',
        client: client,
        schemaName: 'supercopy_test',
        debug: true
      },
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('Should return correctly modified adult rows', function (done) {
    client.query(
      'select adult_no,first_name,last_name from supercopy_test.adults order by adult_no',
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rows).to.eql(
          [
            { adult_no: 40, first_name: 'Marge', last_name: 'Simpson' },
            { adult_no: 60, first_name: 'Abe', last_name: 'Simpson' },
            { adult_no: 80, first_name: 'Ned', last_name: 'Flanders' }
          ]
        )
        done()
      }
    )
  })

  it('Should return correctly modified children rows', function (done) {
    client.query(
      'select child_no,first_name,last_name from supercopy_test.children order by child_no',
      function (err, result) {
        expect(err).to.equal(null)
        expect(result.rows).to.eql(
          [
            {'child_no': 10, 'first_name': 'Lisa', 'last_name': 'Simpson'},
            {'child_no': 30, 'first_name': 'Bart', 'last_name': 'Simpson'},
            {'child_no': 70, 'first_name': 'Milhouse', 'last_name': 'Van Houten'}
          ]
        )
        done()
      }
    )
  })

  it('Should fail supercopy-if some bad-people files', function (done) {
    supercopy(
      {
        sourceDir: path.resolve(__dirname, './fixtures/examples/people-with-an-error'),
        topDownTableOrder: ['children', 'adults'],
        headerColumnNamePkPrefix: '.',
        client: client,
        schemaName: 'supercopy_test',
        debug: true
      },
      function (err) {
        expect(err).to.not.equal(null)
        done()
      }
    )
  })

  it('Should finally drop-cascade the pg_model_test schema', function (done) {
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
