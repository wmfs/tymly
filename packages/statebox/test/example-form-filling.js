/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const DaosToTest = require('./daosToTest')

// Module Resources
const moduleResources = require('./fixtures/module-resources')

// stateMachines
const stateMachines = require('./fixtures/state-machines')

const Statebox = require('./../lib')

DaosToTest().map(([name, dao]) => {
  const options = {
    dao: dao
  }

  describe(`Form-filling tests using ${name}`, function () {
    this.timeout(5000)
    let statebox
    let executionName

    it('should create a new Statebox instance', function () {
      statebox = new Statebox(options)
    })

    it('should add some module resources', function () {
      statebox.createModuleResources(moduleResources)
    })

    it('should add some state machines', function (done) {
      statebox.createStateMachines(
        stateMachines,
        {},
        function (err) {
          expect(err).to.eql(null)
          done()
        }
      )
    })

    it('should start form-filling state machine', function (done) {
      statebox.startExecution(
        {},  // input
        'formFilling', // state machine name
        {}, // options
        function (err, result) {
          expect(err).to.eql(null)
          executionName = result.executionName
          done()
        }
      )
    })

    it('should wait a while', function (done) {
      setTimeout(done, 250)
    })

    it('should prove state machine is still running (i.e. waiting for an external heartbeat update)', function (done) {
      statebox.describeExecution(
        executionName,
        {},
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('RUNNING')
          expect(executionDescription.ctx).to.eql({formId: 'fillThisFormInHuman!'})
          expect(executionDescription.stateMachineName).to.eql('formFilling')
          done()
        }
      )
    })

    it('should send in a heartbeat update (i.e. some part-filled form data)', function (done) {
      statebox.sendTaskHeartbeat(
        executionName,
        {
          some: 'payload'
        }, // output
        {}, // executionOptions
        function (err, executionDescription) {
          expect(err).to.eql(null)
          done()
        }
      )
    })

    it('should wait a while longer...', function (done) {
      setTimeout(done, 250)
    })

    it('should prove heartbeat context has been updated', function (done) {
      statebox.describeExecution(
        executionName,
        {},
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('RUNNING')
          expect(executionDescription.ctx.some).to.eql('payload')
          expect(executionDescription.stateMachineName).to.eql('formFilling')
          done()
        }
      )
    })

    it('should sendTaskSuccess (i.e. some completed form data)', function (done) {
      statebox.sendTaskSuccess(
        executionName,
        {
          formData: {
            name: 'Rupert'
          }
        }, // output
        {}, // executionOptions
        function (err, executionDescription) {
          expect(err).to.eql(null)
          done()
        }
      )
    })

    it('should successfully complete form-filling execution', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('formFilling')
          expect(executionDescription.currentStateName).to.eql('World')
          expect(executionDescription.currentResource).to.eql('module:world')
          expect(executionDescription.ctx).to.eql(
            {
              formData: {
                name: 'Rupert'
              },
              formId: 'fillThisFormInHuman!',
              some: 'payload'
            }
          )
          done()
        }
      )
    })

    it('should start form-filling state machine', function (done) {
      statebox.startExecution(
        {},  // input
        'formFilling', // state machine name
        {}, // options
        function (err, result) {
          expect(err).to.eql(null)
          executionName = result.executionName
          done()
        }
      )
    })

    it('should wait a while', function (done) {
      setTimeout(done, 250)
    })

    it('should prove state machine is still running (i.e. waiting for an external update)', function (done) {
      statebox.describeExecution(
        executionName,
        {},
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('RUNNING')
          expect(executionDescription.ctx).to.eql({formId: 'fillThisFormInHuman!'})
          expect(executionDescription.stateMachineName).to.eql('formFilling')
          done()
        }
      )
    })

    it('should sendTaskFailure', function (done) {
      statebox.sendTaskFailure(
        executionName,
        {
          error: 'BIGFAIL',
          cause: 'Due to some bad thing happening'
        }, // options
        {}, // executionOptions
        function (err) {
          expect(err).to.eql(null)
          done()
        }
      )
    })

    it('should show failed form-filling execution', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.stateMachineName).to.eql('formFilling')
          expect(executionDescription.currentStateName).to.eql('FormFilling')
          expect(executionDescription.currentResource).to.eql('module:formFilling')
          expect(executionDescription.ctx).to.eql({formId: 'fillThisFormInHuman!'})
          done()
        }
      )
    })

    it('should start form-filling state machine, and respond once all the code in \'FormFilling\' has run', function (done) {
      statebox.startExecution(
        {},  // input
        'formFilling', // state machine name
        {
          sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:formFilling'
        }, // options
        function (err, executionDescription) {
          expect(err).to.eql(null)
          executionName = executionDescription.executionName
          expect(executionDescription.status).to.eql('RUNNING')
          expect(executionDescription.stateMachineName).to.eql('formFilling')
          expect(executionDescription.currentStateName).to.eql('FormFilling')
          expect(executionDescription.currentResource).to.eql('module:formFilling')
          done()
        }
      )
    })

    it('should stop execution (i.e. simulates a user clicking cancel on this execution)', function (done) {
      statebox.stopExecution(
        'Form flow cancelled by user',
        'CANCELLED',
        executionName,
        {},
        function (err) {
          expect(err).to.eql(null)
          done()
        }
      )
    })

    it('should prove state machine has stopped (i.e. cancelled by a user)', function (done) {
      statebox.describeExecution(
        executionName,
        {},
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('STOPPED')
          expect(executionDescription.ctx).to.eql({formId: 'fillThisFormInHuman!'})
          expect(executionDescription.stateMachineName).to.eql('formFilling')
          done()
        }
      )
    })

    it('should reject success on a stopped state machine', function (done) {
      statebox.sendTaskSuccess(
        executionName,
        {
          formData: {
            name: 'Rupert'
          }
        }, // output
        {}, // executionOptions
        function (err) {
          expect(err).to.be.an('error')
          done()
        }
      )
    })

    it('should reject failure on a stopped state machine', function (done) {
      statebox.sendTaskFailure(
        executionName,
        {
          formData: {
            name: 'Rupert'
          }
        }, // output
        {}, // executionOptions
        function (err) {
          expect(err).to.be.an('error')
          done()
        }
      )
    })

    it('should reject heartbeat on a stopped state machine', function (done) {
      statebox.sendTaskHeartbeat(
        executionName,
        {
          formData: {
            name: 'Rupert'
          }
        }, // output
        {}, // executionOptions
        function (err) {
          expect(err).to.be.an('error')
          done()
        }
      )
    })
  })
})
