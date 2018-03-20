/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const DaosToTest = require('./daosToTest')

// Module Resources
const moduleResources = require('./fixtures/module-resources')

// stateMachines
const stateMachines = require('./fixtures/state-machines/resource-config-validity')

const Statebox = require('./../lib')

DaosToTest.forEach(([name, options]) => {
  describe(`Resource Config tests using ${name}`, function () {
    this.timeout(process.env.TIMEOUT || 5000)
    let statebox

    it('should create a new Statebox instance', function () {
      statebox = new Statebox(options)
    })

    it('should add some module resources', function () {
      statebox.createModuleResources(moduleResources)
    })

    it('should add some state machines and ensure it fails due to bad resource config', function (done) {
      statebox.createStateMachines(
        stateMachines,
        {},
        function (err) {
          expect(err.message).to.eql(`Resource Config missing required properties in stateMachine 'goodbyeInvalid'`)
          done()
        }
      )
    })
  })
})
