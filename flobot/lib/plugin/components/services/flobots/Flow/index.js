'use strict'
const debug = require('debug')('flobots')
const async = require('async')
const Fsm = require('./Fsm.js')
const _ = require('lodash')
const messages = require('./../../../../../startup-messages/index')
const boom = require('boom')

class Flow {
  constructor (flowId, flowComponent, options) {
    // Set basic properties from definition
    // ------------------------------------
    this.flowId = flowId
    this.name = flowComponent.name
    this.namespace = flowComponent.namespace
    this.version = flowComponent.version

    // Add details from flow definition (could come from a JSON file)
    // --------------------------------------------------------------

    this.label = flowComponent.label
    this.description = flowComponent.description
    this.initialStateId = flowComponent.initialStateId
    this.instigators = flowComponent.instigators || []
    this.initialCtx = flowComponent.initialCtx || {}

    // HOOKS
    // -----
    if (options.onChangeHook) {
      this.onChangeHook = options.onChangeHook
    }
    if (options.onFinishHook) {
      this.onFinishHook = options.onFinishHook
    }

    // FSM
    // ---

    this.fsm = new Fsm(
      this.initialStateId,
      options.services.registry.substitute(this.namespace, flowComponent.fsm, 'options', messages),
      {
        flowId: this.flowId,
        flowName: this.name,
        flowNamespace: this.namespace,
        services: options.services,
        messages: messages
      }
    )
  }

  findStatesByClassName (className) {
    return this.fsm.findStatesByClassName(className)
  }

  // options:
  //  * userId
  //  * meta
  //  * audience
  createFlobot (options) {
    const flobot = {
      status: 'starting',
      flowId: this.flowId,
      stateId: null,
      instigatingClient: options.instigatingClient,
      stateEnterTime: null,
      ctx: this.initialCtx
    }

    if (options) {
      if (options.userId) {
        flobot.createdBy = options.userId
      }
    }

    return flobot
  }

  _runCurrentLeave (flobot, data, callback) {
    const _this = this
    const currentState = this.fsm.states[flobot.stateId]

    // LEAVE
    // -----
    debug(`Flobot ${flobot.flobotId} is leaving state '${flobot.stateId}'`)
    currentState.leave(
      flobot,
      data,
      function (err, whatNext) {
        if (err) {
          callback(err)
        } else {
          if (_this.onChangeHook) {
            _this.onChangeHook(flobot, callback)
          } else {
            callback(null, flobot)
          }
        }
      }
    )
  }

  _runDestinationEnter (destinationStateId, flobot, data, callback) {
    const _this = this
    const destinationState = this.fsm.states[destinationStateId]

    // ENTER
    // -----
    if (destinationState) {
      debug(`Flobot ${flobot.flobotId || '(whose ID is yet to be assigned)'} is entering state '${destinationStateId}'`)
      destinationState.enter(
        flobot,
        data,
        function (err, whatNext) {
          if (err) {
            callback(err)
          } else {
            flobot.stateId = destinationStateId
            flobot.stateEnterTime = new Date()
            // flobot.status = 'running'

            if (_this.onChangeHook) {
              _this.onChangeHook(flobot, callback)
            } else {
              callback(null, flobot)
            }
          }
        }
      )
    }
   else {
        callback(boom.internal('Unable to progress flow - unable to find destination state with id ' + destinationStateId), {destinationStateId: destinationStateId})
      }
    }

    getNextStateIdViaConditionalEvent (targetStates, ctx) {
      let nextStateId
      targetStates.forEach(function (targetState) {
        if (nextStateId === undefined) {
          if (targetState.hasOwnProperty('expression')) {
            if (targetState.expression.evaluate(ctx)) {
              nextStateId = targetState.to
            }
          } else {
            // So this target hasn't got an expression, and there for no where
            // restriction... so it's a match.
            nextStateId = targetState.to
          }
        }
      })

      return nextStateId
    }

    // WE'VE JUST LEFT THE CURRENT STATE: SO WHAT NEXT?
    //   i.e. which event should we take from the current state (if any?)
    //
    // TODO: Loads of things here!
    //  - An explicit eventId can be passed an an option
    //  - Events can have conditions on them.
    //  - If only 1 event is a candidate then auto pick that
    //  - If no viable events, then we're done.

    calculateNextStateId (whatNext, flobot, payload, callback) {
      const _this = this
      const currentStateId = flobot.stateId
      let resolvedEventId
      let resolvedEvent
      let nextStateId
      const currentState = this.fsm.states[currentStateId]
      const currentStateEvents = currentState._events

      if (currentStateEvents === undefined || _.keys(currentStateEvents).length === 0) {
        // Reached a state with no events out of it... flow complete!
        // ----------------------------------------------------------
        callback(null, null)
      } else {
        let viableEventCount = 0

        if (payload !== undefined && payload.eventId !== undefined) {
          // EventId has been explicitly requested in options, so go with that.
          resolvedEventId = payload.eventId
        } else {
          for (let candidateEventId in currentStateEvents) {
            resolvedEventId = candidateEventId
            viableEventCount++
          }
        }

        if (viableEventCount > 1) {
          callback(
            boom.internal(
              'There are ' + viableEventCount + ' viable events to transition from stateId \'' + currentStateId + '\'... which one to take?',
              {
                viableEventCount: viableEventCount,
                currentStateId: currentStateId
              }
            )
          )
        } else {
          if (currentStateEvents.hasOwnProperty(resolvedEventId)) {
            resolvedEvent = currentStateEvents[resolvedEventId]

            if (_.isArray(resolvedEvent)) {
              // Need to derive next state from a set of conditional events
              nextStateId = _this.getNextStateIdViaConditionalEvent(resolvedEvent, _.defaults(flobot.ctx, currentState._stateConfig.options || {}))
            } else {
              // Not conditional, so assume a simple 'to'
              nextStateId = resolvedEvent.to
            }
            callback(null, nextStateId)
          } else {
            callback(
              boom.internal('The \'' + currentStateId + '\' state has no event \'' + resolvedEventId + '\'.'),
              {
                currentStateId: currentStateId,
                resolvedEventId: resolvedEventId
              }
            )
          }
        }
      }
    }

    // Nudge moves the Flobot from its current state to the next...
    // ------------------------------------------------------------
    nudge (flobot, payload, callback) {
      const _this = this

      // LEAVE
      // -----

      if (_.isNull(flobot.stateId)) {
        this._runDestinationEnter('starting', flobot, payload.data, callback)
      } else {
        this._runCurrentLeave(flobot, payload.data, function (err, whatNext) {
          if (err) {
            callback(err)
          } else {
            _this.calculateNextStateId(whatNext, flobot, payload, function (err, destinationStateId) {
              if (err) {
                callback(err)
              } else {
                if (destinationStateId) {
                  _this._runDestinationEnter(destinationStateId, flobot, payload.data, callback)
                } else {
                  flobot.status = 'finished'
                  if (_this.onFinishHook) {
                    _this.onFinishHook(flobot, callback)
                  } else {
                    callback(null, flobot)
                  }
                }
              }
            })
          }
        })
      }
    }

    // Transition through zero-or-more states
    // --------------------------------------
    transition (flobot, payload, callback) {
      const _this = this
      let firstTransition = true

      async.whilst(
        function continueNudging () {
          if (!flobot || flobot.status === 'finished') {
            return false
          } else {
            if (firstTransition) {
              firstTransition = false
              return true
            } else {
              const currentStateId = flobot.stateId
              const currentState = _this.fsm.states[currentStateId]
              return currentState.autoNudge
            }
          }
        },

        function (cb) {
          _this.nudge(flobot, payload, function (err, transitionedFlobot) {
            if (err) {
              cb(err)
            } else {
              // Dispense with initial payload now things have moved on.
              flobot = transitionedFlobot
              payload = {}
              cb(null)
            }
          })
        },

        function (err) {
          if (err) {
            callback(err)
          } else {
            callback(null, flobot)
          }
        }
      )
    }
  }

  module.exports = Flow
