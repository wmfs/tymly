'use strict'

const boom = require('boom')
const logBoomError = require('./log-boom-error')

const dottie = require('dottie')
const Flow = require('./Flow/index')
const async = require('async')
const uuid = require('uuid')
const _ = require('lodash')

const UNSPECIFIED_INSTIGATING_CLIENT = {
  'appName': '__UNSPECIFIED__',
  'domain': '__UNSPECIFIED__'
}

class FlobotsService {
  boot (options, callback) {
    const _this = this

    const storageService = options.bootedServices.storage
    this.flows = {}

    const flowComponents = dottie.get(options, 'blueprintComponents.flows')

    if (flowComponents) {
      this.flobotModel = storageService.models.fbot_flobot

      const flowOptions = {
        services: options.bootedServices,
        onChangeHook: this.flobotOnChangeHook.bind(this),
        onFinishHook: this.flobotOnFinishHook.bind(this)
      }

      let flowComponent
      let flow

      async.eachOfSeries(
        flowComponents,

        function (value, flowId, cb) {
          options.messages.info(flowId)

          flowComponent = flowComponents[flowId]

          flow = new Flow(
            flowId,
            flowComponent,
            flowOptions
          )

          _this.flows[flowId] = flow

          flow.fsm.boot(flowOptions, cb)
        },

        function (err) {
          if (err) {
            callback(err)
          } else {
            if (options.messages.noErrors) {
              callback(null)
            } else {
              callback(options.messages.makeErrorsForCallback('booting flobot service'))
            }
          }
        }
      )
    } else {
      callback(null)
    }
  }

  findFlowById (flowId, callback) {
    if (this.flows.hasOwnProperty(flowId)) {
      callback(null, this.flows[flowId])
    } else {
      const boomErr = boom.notFound("Unable to find flow with id '" + flowId + "'", {flowId: flowId})
      logBoomError(boomErr)
      callback(boomErr)
    }
  }

  start (flowId, options, callback) {
    this.findFlowById(
      flowId,
      function (err, flow) {
        if (err) {
          let boomErr = boom.boomify(err)
          if (!_.isObject(boomErr.data)) {
            boomErr.data = {}
          }
          boomErr.data.flowId = flowId
          logBoomError(boomErr)
          callback(boomErr)
        } else {
          const createOptions = {}
          if (options) {
            if (options.hasOwnProperty('userId')) {
              createOptions.userId = options.userId
            }
            if (options.hasOwnProperty('instigatingClient')) {
              createOptions.instigatingClient = options.instigatingClient
            } else {
              createOptions.instigatingClient = UNSPECIFIED_INSTIGATING_CLIENT
            }
          }

          const flobot = flow.createFlobot(createOptions)

          flow.transition(
            flobot,
            options,

            function (err, transitionedFlobot) {
              if (err) {
                let boomErr = boom.boomify(err)
                if (!_.isObject(boomErr.data)) {
                  boomErr.data = {}
                }
                boomErr.data.flobot = flobot
                logBoomError(boomErr)
                callback(boomErr)
              } else {
                callback(null, transitionedFlobot)
              }
            }
          )
        }
      }
    )
  }

  /**
   * Creates and starts a new Flobot.
   * @param {string} flowId Identifies a flow that's been provided via a blueprint (e.g. `fbotTest_cat_1_0`)
   * @param {Object} options
   * @param {Object} options.data These key/values will be added to the Flobot's context when its created.
   * @param {Object} options.action An optional string that can be used to fine-tune authorization.
   * @param {string} options.userId What userId, if any, should be associated with creating this Flobot?
   * @param {Function} options.onAuthorizationHook A function of form `onAuthorizationHook (flobot, options, callback)` whenever an interaction with the Flobot needs authorizing.
   * @param {Function} callback called with data relating to the freshly-created flobot
   * @returns {undefined}
   * @example
   * flobot.startNewFlobot(
   *   'fbotTest_cat_1_0',
   *   {
   *     userId: 'john.doe@flobotjs.com',
   *     data: {
   *       catName: 'Rupert'
   *     }
   *   },
   *   function (err, flobot) {
   *     // e.g:
   *     //   flobot.flobotId: '586d6aab8c41db1e10097db8'
   *     //   flobot.flowId: 'fbotTest_cat_1_0'
   *     //   flobot.status: 'running'
   *     //   etc.
   *   }
   * )
   */
  startNewFlobot (flowId, options, callback) {
    const _this = this

    if (options && options.hasOwnProperty('onAuthorizationHook')) {
      options.onAuthorizationHook(
        null,
        options,
        function (err) {
          if (err) {
            callback(err)
          } else {
            _this.start(flowId, options, callback)
          }
        }
      )
    } else {
      _this.start(flowId, options, callback)
    }
  }

  transition (flow, flobot, options, callback) {
    flow.transition(
      flobot,
      options,

      function (err, transitionedFlobot) {
        if (err) {
          let boomErr = boom.boomify(err)
          if (!_.isObject(boomErr.data)) {
            boomErr.data = {}
          }
          boomErr.data.flobot = flobot
          logBoomError(boomErr)
          callback(boomErr)
        } else {
          callback(null, transitionedFlobot)
        }
      }
    )
  }

  /**
   * Updates a running Flobot.
   * @param {string} flobotId The flobotId (as returned by `startNewFlobot`) of the flobot that is to be updated
   * @param {Object} options
   * @param {Object} options.eventId Explicitly defines which route the Flobot should head after completing the current state. This is optional - and only of use if Flobot wouldn't ordinarily be able to deduce the next state automatically.
   * @param {Object} options.data These key/values will be updated on the Flobot's context.
   * @param {Object} options.action An optional string that can be used to fine-tune authorization.
   * @param {string} options.userId What userId, if any, should be associated with this update?
   * @param {Function} options.onAuthorizationHook A function of form `onAuthorizationHook (flobot, options, callback)` whenever an interaction with the Flobot needs authorizing.
   * @param {Function} callback called with data relating to the post-updated flobot
   * @returns {undefined}
   * @example
   * flobot.updateFlobot(
   *   '586d6aab8c41db1e10097db8',
   *   {
   *     userId: 'john.doe@flobotjs.com',
   *     eventId: 'tooFull',
   *     data: {
   *       mealInfo: ['tuna', 'biscuits']
   *     }
   *   },
   *   function (err, flobot) {
   *     // e.g:
   *     //   flobot.flobotId: '586d6aab8c41db1e10097db8'
   *     //   flobot.flowId: 'fbotTest_cat_1_0'
   *     //   flobot.status: 'running'
   *     //   flobot.stateId: 'moaning
   *     //   etc.
   *   }
   * )
   */
  updateFlobot (flobotId, options, callback) {
    const _this = this
    this.getFlobot(flobotId, null, function (err, flobot) {
      if (err) {
        let boomErr = boom.boomify(err)
        if (!_.isObject(boomErr.data)) {
          boomErr.data = {}
        }
        boomErr.data.flobotId = flobotId
        logBoomError(boomErr)
        callback(boomErr)
      } else {
        _this.findFlowById(
          flobot.flowId,
          function (err, flow) {
            if (err) {
              callback(err)
            } else {
              if (options && options.hasOwnProperty('onAuthorizationHook')) {
                options.onAuthorizationHook(
                  flobot,
                  options,
                  function (err) {
                    if (err) {
                      callback(err)
                    } else {
                      _this.transition(flow, flobot, options, callback)
                    }
                  }
                )
              } else {
                _this.transition(
                  flow,
                  flobot,
                  options,
                  callback
                )
              }
            }
          }
        )
      }
    })
  }

  /**
   * Gets information about a running Flobot.
   * @param {string} flobotId The flobotId (as returned by `startNewFlobot`) of the flobot that information is required for
   * @param {Object} options
   * @param {Object} options.action An optional string that can be used to fine-tune authorization.
   * @param {string} options.userId What userId, if any, should be associated with getting this data?
   * @param {Function} options.onAuthorizationHook A function of form `onAuthorizationHook (flobot, options, callback)` whenever an interaction with the Flobot needs authorizing.
   * @param {Function} callback called with the latest data relating to the flobot
   * @returns {undefined}
   * @example
   * flobot.getFlobot(
   *   '586d6aab8c41db1e10097db8',
   *   {
   *     userId: 'john.doe@flobotjs.com'
   *   },
   *   function (err, flobot) {
   *     // e.g:
   *     //   flobot.flobotId: '586d6aab8c41db1e10097db8'
   *     //   flobot.flowId: 'fbotTest_cat_1_0'
   *     //   flobot.status: 'running'
   *     //   flobot.stateId: 'moaning
   *     //   etc.
   *   }
   * )
   */
  getFlobot (flobotId, options, callback) {
    this.flobotModel.findById(
      flobotId,
      function (err, flobot) {
        if (err) {
          let boomErr = boom.boomify(err)
          if (!_.isObject(boomErr.data)) {
            boomErr.data = {}
          }
          boomErr.data.flobotId = flobotId
          logBoomError(boomErr)
          callback(boomErr)
        } else {
          if (flobot) {
            if (options && options.hasOwnProperty('onAuthorizationHook')) {
              options.onAuthorizationHook(
                flobot,
                options,
                function (err) {
                  if (err) {
                    callback(err)
                  } else {
                    callback(null, flobot)
                  }
                }
              )
            } else {
              callback(null, flobot)
            }
          } else {
            const boomErr = boom.notFound("No flobot with id '" + flobotId + "' could be found.", {flobotId: flobotId})
            logBoomError(boomErr)
            callback(boomErr)
          }
        }
      }
    )
  }

  cancel (flobotId, callback) {
    this.flobotModel.destroyById(
      flobotId,
      function (err) {
        if (err) {
          let boomErr = boom.boomify(err)
          if (!_.isObject(boomErr.data)) {
            boomErr.data = {}
          }
          boomErr.data.flobotId = flobotId
          logBoomError(boomErr)
          callback(boomErr)
        } else {
          callback(null)
        }
      }
    )
  }

  /**
   * Cancels a running Flobot.
   * @param {string} flobotId The flobotId (as returned by `startNewFlobot`) of the flobot that needs cancelling
   * @param {Object} options
   * @param {Object} options.action An optional string that can be used to fine-tune authorization.
   * @param {string} options.userId What userId, if any, should be associated with the cancellation of this Flobot?
   * @param {Function} options.onAuthorizationHook A function of form `onAuthorizationHook (flobot, options, callback)` whenever an interaction with the Flobot needs authorizing.
   * @param {Function} callback called with the information about the flobot just prior to being cancelled
   * @returns {undefined}
   * @example
   * flobot.cancelFlobot(
   *   '586d6aab8c41db1e10097db8',
   *   {
   *     userId: 'john.doe@flobotjs.com'
   *   },
   *   function (err, flobot) {
   *     // e.g:
   *     //   flobot.flobotId: '586d6aab8c41db1e10097db8'
   *     //   flobot.flowId: 'fbotTest_cat_1_0'
   *     //   flobot.status: 'running'
   *     //   flobot.stateId: 'moaning
   *     //   etc.
   *   }
   * )
   */
  cancelFlobot (flobotId, options, callback) {
    const _this = this

    if (options && options.hasOwnProperty('onAuthorizationHook')) {
      this.getFlobot(flobotId, null, function (err, flobot) {
        if (err) {
          callback(err)
        } else {
          options.onAuthorizationHook(
            flobot,
            options,
            function (err) {
              if (err) {
                callback(err)
              } else {
                _this.cancel(flobotId, callback)
              }
            }
          )
        }
      })
    } else {
      _this.cancel(flobotId, callback)
    }
  }

  flobotOnChangeHook (flobot, callback) {
    let flobotId = flobot.flobotId
    if (!flobotId) {
      flobotId = uuid()
      flobot.flobotId = flobotId
    }

    this.flobotModel.upsert(
      flobot,
      {},
      function (err, res) {
        if (err) {
          callback(err)
        } else {
          callback(null, flobot)
        }
      }
    )
  }

  flobotOnFinishHook (flobot, callback) {
    const flobotId = flobot.flobotId

    this.flobotModel.destroyById(
      flobotId,
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

module.exports = {
  serviceClass: FlobotsService,
  bootAfter: ['storage', 'commands', 'states', 'expression', 'temp'],
  configModifier: function flobotsServiceConfigModifier (ctx) {
    ctx.utils.idNamespacer('flowId', 'flows', ctx)
  }

}
