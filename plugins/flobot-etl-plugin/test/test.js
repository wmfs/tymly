/* eslint-env mocha */
'use strict'
const flobot = require('flobot')
const path = require('path')
const expect = require('chai').expect
const glob = require('glob')
const _ = require('lodash')

describe('Simple CSV and flobot test', function () {
  this.timeout(5000)
  let flobotsService

  it('should start Flobot service', function (done) {
    flobot.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/people-blueprint')
        ]
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        flobotsService = flobotServices.flobots
        done()
      }
    )
  })

  it('should run a Flobot to process CSV file', function (done) {
    flobotsService.startNewFlobot(
      'fbotTest_people_1_0',
      {
        data: {
          sourceFilePaths: path.resolve(__dirname, 'fixtures', 'people.csv'),
          outputDirRootPath: path.resolve(__dirname, 'fixtures', 'output'),
          sourceDir: path.resolve(__dirname, 'fixtures', 'output')
        }
      },
      function (err) {
        expect(err).to.eql(null)
        done()
      }
    )
  })

  it('should create delete and upserts directories', function (done) {
    glob(path.resolve(__dirname, 'fixtures', 'output', '*'), function (err, files) {
      expect(err).to.equal(null)
      expect(files).to.deep.equal([
        _.replace(path.resolve(__dirname, 'fixtures', 'output', 'delete'), /\\/g, '/'),
        _.replace(path.resolve(__dirname, 'fixtures', 'output', 'manifest.json'), /\\/g, '/'),
        _.replace(path.resolve(__dirname, 'fixtures', 'output', 'upserts'), /\\/g, '/')
      ])
      done()
    })
  })
})
