/* eslint-env mocha */
'use strict'
const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const glob = require('glob')
const _ = require('lodash')
const csv = require('csvtojson')
const STATE_MACHINE_NAME = 'tymlyTest_people_1_0'

describe('CSV and tymly test', function () {
  const fixture = path.resolve(__dirname, 'fixtures', 'people')

  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService
  let statebox

  it('should start Tymly service', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/people/blueprints/people-blueprint')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        done()
      }
    )
  })

  it('should run a new execution to process CSV file', function (done) {
    statebox.startExecution(
      {
        sourceFilePaths: path.resolve(fixture, 'input', 'people.csv'),
        outputDirRootPath: path.resolve(fixture, 'output'),
        sourceDir: path.resolve(fixture, 'output')
      }, // input
      STATE_MACHINE_NAME, // state machine name
      {
        sendResponse: 'COMPLETE'
      }, // options
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.eql('ProcessingCsvFiles')
        done()
      }
    )
  })

  it('should create delete and upserts directories', function (done) {
    glob(path.resolve(fixture, 'output', '*'), function (err, files) {
      expect(err).to.equal(null)
      expect(files).to.deep.equal([
        _.replace(path.resolve(fixture, 'output', 'delete'), /\\/g, '/'),
        _.replace(path.resolve(fixture, 'output', 'manifest.json'), /\\/g, '/'),
        _.replace(path.resolve(fixture, 'output', 'upserts'), /\\/g, '/')
      ])
      done()
    })
  })

  it('should check delete files have been split correctly', function (done) {
    let csvDeletesPath = path.resolve(fixture, 'output', 'delete', 'people.csv')
    csv()
      .fromFile(csvDeletesPath)
      .on('json', function (json) {
        expect(json.action).to.equal('d')
      })
      .on('done', function (err) {
        expect(err).to.eql(undefined)
        done()
      })
  })

  it('should check upserts files have been split correctly', function (done) {
    let csvUpsertsPath = path.resolve(fixture, 'output', 'upserts', 'people.csv')
    csv()
      .fromFile(csvUpsertsPath)
      .on('json', function (json) {
        expect(json.action).to.satisfy(function (action) {
          if (action === 'x' || action === 'u' || action === 'i') {
            return true
          } else {
            return false
          }
        })
      })
      .on('done', function (err) {
        expect(err).to.eql(undefined)
        done()
      })
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
