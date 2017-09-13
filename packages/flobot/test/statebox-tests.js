/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const STATE_MACHINE_NAME = 'fbotTest_aDayInTheLife'

describe('Simple Flobot test', function () {
  const flobot = require('./../lib')
  let statebox
  this.timeout(5000)
  let rupert

  it('should create some basic flobot services to run a simple cat blueprint', function (done) {
    flobot.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
        ],

        pluginPaths: [
          path.resolve(__dirname, './fixtures/plugins/cats-plugin')
        ]
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        statebox = flobotServices.statebox
        done()
      }
    )
  })

  it('should find cat state machine', function () {
    const stateMachine = statebox.findStateMachineByName(STATE_MACHINE_NAME)
    expect(stateMachine.name).to.eql(STATE_MACHINE_NAME)
  })

  it('should fail finding dog state machine', function () {
    const stateMachine = statebox.findStateMachineByName('DOGS!')
    expect(stateMachine).to.be.an('undefined')
  })

  it('should execute cat state machine', function (done) {
    statebox.startExecution(
      {
        petName: 'Rupert',
        gender: 'male',
        hoursSinceLastMotion: 11,
        hoursSinceLastMeal: 5,
        petDiary: []
      },  // input
      STATE_MACHINE_NAME, // state machine name
      {}, // options
      function (err, result) {
        expect(err).to.eql(null)
        rupert = result.executionName
        done()
      }
    )
  })

  it('should successfully complete Rupert\'s day', function (done) {
    statebox.waitUntilStoppedRunning(
      rupert,
      function (err, executionDescription) {
        console.log('?????', executionDescription)
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.stateMachineName).to.eql('fbotTest_aDayInTheLife')
        expect(executionDescription.currentStateName).to.eql('Sleeping')
        done()
      }
    )
  })

  //
  //
  // it('should start a Flobot for Rupert the cat.', function (done) {
  //   flobot.startNewFlobot(
  //     'fbotTest_cat_1_0',
  //     {
  //       instigatingClient: {
  //         appName: 'flobotJS',
  //         domain: 'test',
  //         vendor: {
  //           module: 'flobot',
  //           file: './test/simple-cat-spec.js'
  //         }
  //       },
  //       data: {
  //         petName: 'Rupert'
  //       }
  //     },
  //     function (err, rupertFlobot) {
  //       expect(err).to.eql(null)
  //       expect(rupertFlobot.flobotId).to.be.a('string')
  //       rupertFlobotId = rupertFlobot.flobotId
  //       expect(rupertFlobot.flowId).to.eql('fbotTest_cat_1_0')
  //       expect(rupertFlobot.instigatingClient).to.eql(
  //         {
  //           appName: 'flobotJS',
  //           domain: 'test',
  //           vendor: {
  //             module: 'flobot',
  //             file: './test/simple-cat-spec.js'
  //           }
  //         }
  //       )
  //       expect(rupertFlobot.ctx.petName).to.eql('Rupert')
  //       expect(rupertFlobot.stateId).to.eql('sleeping')
  //       expect(rupertFlobot.stateEnterTime).to.be.a('date')
  //       done()
  //     }
  //   )
  // })
  //
  //
  //
  // it('should transition Rupert to sitting', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'stretch'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.flobotId).to.be.a('string')
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('sitting')
  //       done()
  //     }
  //   )
  // })
  //
  // it("should transition to walking (because we explicitly took the 'thingsToDo' event)", function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'thingsToDo'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('walking')
  //       done()
  //     }
  //   )
  // })
  //
  // it("should transition Rupert back to sitting (auto-pick the 'stop' event)", function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {},
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('sitting')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should fail to transition Rupert away from sitting (no implicit event to infer)', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {},
  //     function (err) {
  //       expect(err).to.be.an('error')
  //       expect(err.message).to.eql("There are 6 viable events to transition from stateId 'sitting'... which one to take?")
  //       expect(err.output.statusCode).to.eql(500)
  //       done()
  //     }
  //   )
  // })
  //
  // it('should fail to transition Rupert due to trying an unknown event', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'needThatCatnip'
  //     },
  //     function (err) {
  //       expect(err).to.be.an('error')
  //       expect(err.message).to.eql("The 'sitting' state has no event 'needThatCatnip'.")
  //       expect(err.output.statusCode).to.eql(500)
  //       done()
  //     }
  //   )
  // })
  //
  // it('should see Rupert eating Meal #1... an automated and uninterruptible process. Should be purring at the end.', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'hungry'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('purring')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should see Rupert going for meal #2 and still be purring by the end of it.', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'hungry'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('purring')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should see Rupert moaning at the end of Meal #3.', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'hungry'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('moaning')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should see a moaning Rupert stropping-off to the litter box', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'stropOff',
  //       data: {destination: 'litter box'}
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('walking')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should have Rupert sitting again', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'stop'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('sitting')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should have Rupert pooing', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'squat'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('pooing')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should have Rupert sitting again', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'smugness'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('sitting')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should go back to sleep', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'allTooMuch'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('running')
  //       expect(flobot.stateId).to.eql('sleeping')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should finish with Rupert retiring for the evening', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {
  //       eventId: 'turnIn'
  //     },
  //     function (err, flobot) {
  //       expect(err).to.eql(null)
  //       expect(flobot.status).to.eql('finished')
  //       expect(flobot.stateId).to.eql('retiring')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should fail because Rupert has retired for the evening', function (done) {
  //   flobot.updateFlobot(
  //     rupertFlobotId,
  //     {},
  //     function (err, flobot) {
  //       expect(err.name).to.be.a('string')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should start a Flobot for Alan the cat.', function (done) {
  //   flobot.startNewFlobot(
  //     'fbotTest_cat_1_0',
  //     {
  //       data: {
  //         petName: 'Alan',
  //         meta: {
  //           audience: ['userA', 'userB']
  //         }
  //       }
  //     },
  //     function (err, alanFlobot) {
  //       expect(err).to.eql(null)
  //       expect(alanFlobot.flobotId).to.be.a('string')
  //       expect(alanFlobot.instigatingClient).to.eql(
  //         {
  //           appName: '__UNSPECIFIED__',
  //           domain: '__UNSPECIFIED__'
  //         }
  //       )
  //       expect(alanFlobot.ctx.meta.audience).to.eql(['userA', 'userB'])
  //       alanFlobotId = alanFlobot.flobotId
  //       expect(alanFlobot.ctx.petName).to.eql('Alan')
  //       done()
  //     }
  //   )
  // })
  //
  // it('should cancel Alan the cat.', function (done) {
  //   flobot.cancelFlobot(
  //     alanFlobotId,
  //     {},
  //     function (err, alanFlobot) {
  //       expect(err).to.eql(null)
  //       done()
  //     }
  //   )
  // })
  //
  // it('should fail because Alan has been cancelled', function (done) {
  //   flobot.updateFlobot(
  //     alanFlobotId,
  //     {},
  //     function (err, flobot) {
  //       expect(err.name).to.be.a('string')
  //       done()
  //     }
  //   )
  // })
  // */
})
