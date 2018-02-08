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

DaosToTest.forEach(([name, options]) => {
  describe(`Simple stateMachine tests using ${name}`, function () {
    this.timeout(process.env.TIMEOUT || 5000)
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

    it('should execute helloWorld', function (done) {
      statebox.startExecution(
        {},  // input
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

    it('should successfully complete helloWorld execution', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('helloWorld')
          expect(executionDescription.currentStateName).to.eql('Hello World')
          expect(executionDescription.currentResource).to.eql('module:helloWorld')
          done()
        }
      )
    })

    it('should execute helloThenWorldThroughException', function (done) {
      statebox.startExecution(
        {},  // input
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

    it('should successfully complete helloThenWorldThroughException execution', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('helloThenWorldThroughException')
          expect(executionDescription.currentStateName).to.eql('World')
          expect(executionDescription.currentResource).to.eql('module:world')
          done()
        }
      )
    })

    it('should fail when asked to wait on a non-existant execution', function (done) {
      statebox.waitUntilStoppedRunning(
        'monkey-trousers',
        function (err, executionDescription) {
          try {
            expect(err).to.not.eql(null)
            done()
          } catch (oops) {
            done(oops)
          }
        }
      )
    })

    it('should execute helloWorld, but receive SUCCEEDED response {sendResponse: \'COMPLETE\'}', function (done) {
      statebox.startExecution(
        {},  // input
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

    it('should execute helloThenWorld', function (done) {
      statebox.startExecution(
        {},  // input
        'helloThenWorld', // state machine name
        {}, // options
        function (err, result) {
          expect(err).to.eql(null)
          executionName = result.executionName
          done()
        }
      )
    })

    it('should successfully complete helloThenWorld execution', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('helloThenWorld')
          expect(executionDescription.currentStateName).to.eql('World')
          expect(executionDescription.currentResource).to.eql('module:world')
          done()
        }
      )
    })

    it('should execute helloThenFailure', function (done) {
      statebox.startExecution(
        {},  // input
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

    it('should successfully fail helloThenFailure execution 2', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.stateMachineName).to.eql('helloThenFailure')
          expect(executionDescription.currentStateName).to.eql('Failure')
          expect(executionDescription.currentResource).to.eql('module:failure')
          expect(executionDescription.errorCode).to.eql('SomethingBadHappened')
          expect(executionDescription.errorMessage).to.eql('But at least it was expected')
          done()
        }
      )
    })

    it('should execute helloThenUncaughtFailure', function (done) {
      statebox.startExecution(
        {},  // input
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

    it('should successfully fail helloThenUncaughtFailure execution 2', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.stateMachineName).to.eql('helloThenUncaughtFailure')
          expect(executionDescription.currentStateName).to.eql('Failure')
          expect(executionDescription.currentResource).to.eql('module:failure')
          expect(executionDescription.errorCode).to.eql('SomethingBadHappened')
          expect(executionDescription.errorMessage).to.eql('But at least it was expected')
          done()
        }
      )
    })

    it('should execute helloThenFailure, but receive FAILED response {sendResponse: \'COMPLETE\'}', function (done) {
      statebox.startExecution(
        {},  // input
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

    it('should execute calculator', function (done) {
      statebox.startExecution(
        {
          number1: 3,
          operator: '+',
          number2: 2
        },  // input
        'calculator', // state machine name
        {}, // options
        function (err, result) {
          expect(err).to.eql(null)
          executionName = result.executionName
          done()
        }
      )
    })

    it('should successfully complete calculator execution (add)', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('calculator')
          expect(executionDescription.currentStateName).to.eql('Add')
          expect(executionDescription.currentResource).to.eql('module:add')
          expect(executionDescription.ctx.result).to.eql(5)
          done()
        }
      )
    })

    it('should execute calculator', function (done) {
      statebox.startExecution(
        {
          number1: 3,
          operator: '-',
          number2: 2
        },  // input
        'calculator', // state machine name
        {}, // options
        function (err, result) {
          expect(err).to.eql(null)
          executionName = result.executionName
          done()
        }
      )
    })

    it('should successfully complete calculator execution (subtract)', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('calculator')
          expect(executionDescription.currentStateName).to.eql('Subtract')
          expect(executionDescription.currentResource).to.eql('module:subtract')
          expect(executionDescription.ctx.result).to.eql(1)
          done()
        }
      )
    })

    it('should execute calculator (with input paths)', function (done) {
      statebox.startExecution(
        {
          numbers: {
            number1: 3,
            number2: 2
          },
          operator: '-'
        },  // input
        'calculatorWithInputPaths', // state machine name
        {}, // options
        function (err, result) {
          expect(err).to.eql(null)
          executionName = result.executionName
          done()
        }
      )
    })

    it('should successfully complete calculator (with input paths) execution (subtract)', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
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

    it('should prove describeExecution works as expected', function (done) {
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

    it('should execute pass stateMachine', function (done) {
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

    it('should successfully complete passStateMachine execution', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
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
          done()
        }
      )
    })

    it('should execute fail stateMachine', function (done) {
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

    it('should respond with a failed execution', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.stateMachineName).to.eql('fail')
          expect(executionDescription.currentStateName).to.eql('FailState')
          expect(executionDescription.currentResource).to.eql(undefined)
          expect(executionDescription.errorMessage).to.eql('Invalid response.')
          expect(executionDescription.errorCode).to.eql('ErrorA')
          done()
        }
      )
    })

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

    it('should execute parallel stateMachine', function (done) {
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

    it('should respond with a successful parallel execution', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          expect(executionDescription.stateMachineName).to.eql('parallel')
          expect(executionDescription.currentStateName).to.eql('G')
          expect(executionDescription.currentResource).to.eql('module:g')
          done()
        }
      )
    })

    it('should execute parallel-failing stateMachine', function (done) {
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

    it('should respond with a failed parallel execution', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          expect(executionDescription.status).to.eql('FAILED')
          expect(executionDescription.stateMachineName).to.eql('parallelFail')
          expect(executionDescription.currentStateName).to.eql('Parallel1')
          expect(executionDescription.currentResource).to.eql(undefined)
          expect(executionDescription.errorCause).to.eql('States.BranchFailed')
          expect(executionDescription.errorCode).to.eql('Failed because a state in a parallel branch has failed')
          done()
        }
      )
    })

    it('Should execute the wait state machine', function (done) {
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

    it('Should wait for the wait state machine to finish and compare the times to check the wait happened', function (done) {
      statebox.waitUntilStoppedRunning(
        executionName,
        function (err, executionDescription) {
          expect(err).to.eql(null)
          const diff = new Date().getTime() - new Date(executionDescription.startDate).getTime()
          expect(diff).to.be.above(3000)
          expect(executionDescription.status).to.eql('SUCCEEDED')
          done()
        }
      )
    })
  })
})
