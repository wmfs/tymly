/* eslint-env mocha */
'use strict'

const formMaker = require('./../lib')
const expect = require('chai').expect
const path = require('path')
const glob = require('glob')
const _ = require('lodash')

describe('Run some basic tests', function () {
  let blueprintPath = 'fixtures/blueprints/people-blueprint' // '../../../blueprints/addressbox-blueprint'
  it('Should generate form schema and editor flow', function (done) {
    formMaker(
      {
        blueprintDir: path.join(__dirname, blueprintPath) // 'c:/development/blueprints/addressbox-blueprint'
      },
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })
  it('Should have created a forms directory', function (done) {
    glob(path.join(__dirname, blueprintPath + '/forms'), function (err, files) {
      expect(err).to.equal(null)
      expect(files).to.deep.equal([
        _.replace(path.join(__dirname, blueprintPath, '/forms'), /\\/g, '/')
      ])
      done()
    })
  })

  it('Should have created an editor flow file', function (done) {
    glob(path.join(__dirname, blueprintPath + '/state-machines/*-editor.json'), function (err, files) {
      expect(err).to.equal(null)
      expect(files).to.not.equal(null)
      done()
    })
  })

  it('Should have created a form file', function (done) {
    glob(path.join(__dirname, blueprintPath + '/forms/*'), function (err, files) {
      expect(err).to.equal(null)
      expect(files).to.not.equal(null)
      done()
    })
  })
})
