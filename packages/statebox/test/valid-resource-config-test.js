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

describe('Resource Config tests', () => {
  DaosToTest.forEach(([name, options]) => {
    describe(`Using ${name}`, function () {
      this.timeout(process.env.TIMEOUT || 5000)
      let statebox

      it('create a new Statebox', function () {
        statebox = new Statebox(options)
      })

      it('add some module resources', function () {
        statebox.createModuleResources(moduleResources)
      })

      it('add some state machines and ensure it fails due to bad resource config', function (done) {
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
})
