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

describe('State machines', () => {
  DaosToTest.forEach(([name, options]) => {
    describe(`Using ${name}`, function () {
      this.timeout(process.env.TIMEOUT || 5000)
      let statebox
      let executionName

      describe('set up', () => {
        it('create a new Statebox', function () {
          statebox = new Statebox(options)
        })

        it('add module resources', function () {
          statebox.createModuleResources(moduleResources)
        })

        it('add state machines', function (done) {
          statebox.createStateMachines(
            stateMachines,
            {},
            function (err) {
              expect(err).to.eql(null)
              done()
            }
          )
        })
      })

      describe('helloWorld - state machine with a single state', () => {
        it('start', function (done) {
          statebox.startExecution(
            {}, // input
            'helloWorld', // state machine name
            {}, // options
            function (err, executionDescription) {
              expect(err).to.eql(null)
              expect(executionDescription.status).to.eql('RUNNING')
              executionName = executionDescription.executionName
              done()
            }
          )
        })

        it('waitUntilStopped', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('helloWorld')
          expect(executionDescription.currentStateName).to.eql('Hello World')
          expect(executionDescription.currentResource).to.eql('module:helloWorld')
        })
      })

      describe('helloThenWorldThroughException, four-state machine which fails mid-way but recovers via catching exceptions', () => {
        it('start', function (done) {
          statebox.startExecution(
            {}, // input
            'helloThenWorldThroughException', // state machine name
            {}, // options
            function (err, executionDescription) {
              expect(err).to.eql(null)
              expect(executionDescription.status).to.eql('RUNNING')
              executionName = executionDescription.executionName
              done()
            }
          )
        })

        it('waitUntilStoppedRunning', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('helloThenWorldThroughException')
          expect(executionDescription.currentStateName).to.eql('World')
          expect(executionDescription.currentResource).to.eql('module:world')
        })
      })

      describe('helloThenWorld - state machine with two states', () => {
        it('startExecution', function (done) {
          statebox.startExecution(
            {}, // input
            'helloThenWorld', // state machine name
            {}, // options
            function (err, result) {
              expect(err).to.eql(null)
              executionName = result.executionName
              done()
            }
          )
        })

        it('waitUntilStoppedRunning', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('helloThenWorld')
          expect(executionDescription.currentStateName).to.eql('World')
          expect(executionDescription.currentResource).to.eql('module:world')
        })
      })

      describe('helloThenFailure, two state machine which fails in second state', () => {
        it('startExecution', function (done) {
          statebox.startExecution(
            {}, // input
            'helloThenFailure', // state machine name
            {}, // options
            function (err, executionDescription) {
              expect(err).to.eql(null)
              executionName = executionDescription.executionName
              expect(executionDescription.status).to.eql('RUNNING')
              done()
            }
          )
        })

        it('waitUntilStoppedRunning reports failure', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.stateMachineName).to.eql('helloThenFailure')
          expect(executionDescription.currentStateName).to.eql('Failure')
          expect(executionDescription.currentResource).to.eql('module:failure')
          expect(executionDescription.errorCode).to.eql('SomethingBadHappened')
          expect(executionDescription.errorMessage).to.eql('But at least it was expected')
        })
      })

      describe('helloThenUncaughtFailure, a state machine that fails with an exception its error recovery does not catch', () => {
        it('startExecution', function (done) {
          statebox.startExecution(
            {}, // input
            'helloThenUncaughtFailure', // state machine name
            {}, // options
            function (err, executionDescription) {
              expect(err).to.eql(null)
              executionName = executionDescription.executionName
              expect(executionDescription.status).to.eql('RUNNING')
              done()
            }
          )
        })

        it('waitUntilStoppedRunning reports failure', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.stateMachineName).to.eql('helloThenUncaughtFailure')
          expect(executionDescription.currentStateName).to.eql('Failure')
          expect(executionDescription.currentResource).to.eql('module:failure')
          expect(executionDescription.errorCode).to.eql('SomethingBadHappened')
          expect(executionDescription.errorMessage).to.eql('But at least it was expected')
        })
      })

      describe('calculator - a state machine with choice state', () => {
        it('startExecution add', function (done) {
          statebox.startExecution(
            {
              number1: 3,
              operator: '+',
              number2: 2
            }, // input
            'calculator', // state machine name
            {}, // options
            function (err, result) {
              expect(err).to.eql(null)
              executionName = result.executionName
              done()
            }
          )
        })

        it('waitForStoppedRunning', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('calculator')
          expect(executionDescription.currentStateName).to.eql('Add')
          expect(executionDescription.currentResource).to.eql('module:add')
          expect(executionDescription.ctx.result).to.eql(5)
        })

        it('startExecution subtract', function (done) {
          statebox.startExecution(
            {
              number1: 3,
              operator: '-',
              number2: 2
            }, // input
            'calculator', // state machine name
            {}, // options
            function (err, result) {
              expect(err).to.eql(null)
              executionName = result.executionName
              done()
            }
          )
        })

        it('waitForStoppedRunning', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('calculator')
          expect(executionDescription.currentStateName).to.eql('Subtract')
          expect(executionDescription.currentResource).to.eql('module:subtract')
          expect(executionDescription.ctx.result).to.eql(1)
        })

        it('startExecution, with input paths', function (done) {
          statebox.startExecution(
            {
              numbers: {
                number1: 3,
                number2: 2
              },
              operator: '-'
            }, // input
            'calculatorWithInputPaths', // state machine name
            {}, // options
            function (err, result) {
              expect(err).to.eql(null)
              executionName = result.executionName
              done()
            }
          )
        })

        it('waitForStoppedRunning', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('calculatorWithInputPaths')
          expect(executionDescription.currentStateName).to.eql('Subtract')
          expect(executionDescription.currentResource).to.eql('module:subtract')
          expect(executionDescription.ctx.result).to.eql(1)
        })

        it('describeExecution', function (done) {
          statebox.describeExecution(
            executionName,
            {},
            function (err, executionDescription) {
              expect(err).to.eql(null)
              expect(executionDescription.status).to.eql('SUCCEEDED')
              expect(executionDescription.stateMachineName).to.eql('calculatorWithInputPaths')
              expect(executionDescription.currentStateName).to.eql('Subtract')
              expect(executionDescription.currentResource).to.eql('module:subtract')
              expect(executionDescription.ctx.result).to.eql(1)
              done()
            }
          )
        })
      })

      describe('pass state', () => {
        it('startExecution', function (done) {
          statebox.startExecution(
            {
              georefOf: 'Home'
            },
            'pass', // state machine name
            {}, // options
            function (err, result) {
              expect(err).to.eql(null)
              executionName = result.executionName
              done()
            }
          )
        })

        it('waitUntilStoppedRunning', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('pass')
          expect(executionDescription.currentStateName).to.eql('PassState')
          expect(executionDescription.currentResource).to.eql(undefined)
          expect(executionDescription.ctx).to.eql(
            {
              georefOf: 'Home',
              coords: {
                'x-datum': 0,
                'y-datum': 600
              }
            }
          )
        })
      })

      describe('fail state', () => {
        it('startExecution', function (done) {
          statebox.startExecution(
            {},
            'fail', // state machine name
            {}, // options
            function (err, result) {
              expect(err).to.eql(null)
              executionName = result.executionName
              done()
            }
          )
        })

        it('waitUntilStoppedRunning reports failure', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.stateMachineName).to.eql('fail')
          expect(executionDescription.currentStateName).to.eql('FailState')
          expect(executionDescription.currentResource).to.eql(undefined)
          expect(executionDescription.errorMessage).to.eql('Invalid response.')
          expect(executionDescription.errorCode).to.eql('ErrorA')
        })
      })

      describe('parallel - state machine with multiple parallel branches', () => {
        //
        //                        |
        //                    Parallel1
        //                    |       |
        //                    A       B
        //                (+4 secs)   |
        //                 |      Parallel2
        //                 |      |       |
        //                 |      C       D
        //                 |  (+2 secs)   |
        //                 |      |       E
        //                 |      |       |
        //                 |      ---------
        //                 |          |
        //                 |          F
        //                 |          |
        //                 ------------
        //                       |
        //                       G
        // Expected order [Parallel1, B, Parallel2, D, E, C, F, A, G ]
        it('startExecution', function (done) {
          statebox.startExecution(
            {
              results: []
            },
            'parallel', // state machine name
            {}, // options
            function (err, result) {
              expect(err).to.eql(null)
              executionName = result.executionName
              done()
            }
          )
        })

        it('waitUntilStoppedRunning', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('parallel')
          expect(executionDescription.currentStateName).to.eql('G')
          expect(executionDescription.currentResource).to.eql('module:g')
        })
      })

      describe('parallel-failing - state machine with multiple parallel branches with a failing branch', () => {
        it('startExecution', function (done) {
          statebox.startExecution(
            {
              results: []
            },
            'parallelFail', // state machine name
            {}, // options
            function (err, result) {
              expect(err).to.eql(null)
              executionName = result.executionName
              done()
            }
          )
        })

        it('waitUntilStoppedRunning reports failure', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.stateMachineName).to.eql('parallelFail')
          expect(executionDescription.currentStateName).to.eql('Parallel1')
          expect(executionDescription.currentResource).to.eql(undefined)
          expect(executionDescription.errorCause).to.eql('States.BranchFailed')
          expect(executionDescription.errorCode).to.eql('Failed because a state in a parallel branch has failed')
        })
      })

      describe('wait state', () => {
        it('startExecution', function (done) {
          statebox.startExecution(
            {},
            'waitState',
            {},
            (err, result) => {
              expect(err).to.eql(null)
              expect(result.stateMachineName).to.eql('waitState')
              expect(result.status).to.eql('RUNNING')
              executionName = result.executionName
              console.log('execution name: ', executionName)
              done()
            })
        }
        )

        it('verify elapsed time', async () => {
          const executionDescription = await statebox.waitUntilStoppedRunning(executionName)

          const diff = new Date().getTime() - new Date(executionDescription.startDate).getTime()
          expect(diff).to.be.above(3000)
          expect(executionDescription.status).to.eql('SUCCEEDED')
        })
      })

      describe('startExecution with sendResponse: COMPLETE', () => {
        it('helloWorld succeeds', function (done) {
          statebox.startExecution(
            {}, // input
            'helloWorld', // state machine name
            {
              sendResponse: 'COMPLETE'
            }, // options
            function (err, executionDescription) {
              expect(err).to.eql(null)
              expect(executionDescription.status).to.eql('SUCCEEDED')
              done()
            }
          )
        })

        it('helloThenFailure fails', function (done) {
          statebox.startExecution(
            {}, // input
            'helloThenFailure', // state machine name
            {
              sendResponse: 'COMPLETE'
            }, // options
            function (err, result) {
              expect(err).to.eql(null)
              executionName = result.executionName
              expect(result.status).to.eql('FAILED')
              done()
            }
          )
        })
      })

      describe('non-existant executions', () => {
        it('waitUntilStoppedRunning fails', (done) => {
          statebox.waitUntilStoppedRunning('monkey-trousers')
            .then(() => done('should have thrown'))
            .catch(() => done())
        })
      })
    })
  })
})
