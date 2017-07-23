'use strict'

const _ = require('lodash')
const async = require('async')
const schema = require('./schema.json')
const boom = require('boom')

class UsersService {
  boot (options, callback) {
    const _this = this
    this.messages = options.messages

    this.rbac = options.bootedServices.rbac
    this.flobotsService = options.bootedServices.flobots
    this.flows = this.flobotsService.flows

    if (options.bootedServices.hasOwnProperty('forms')) {
      // TODO: This is grim. Should be a hook?
      this.forms = options.bootedServices.forms.forms
    }

    this.roleMembershipModel = options.bootedServices.storage.models.fbot_roleMembership
    const caches = options.bootedServices.caches
    caches.defaultIfNotInConfig('userMemberships', 500)
    this.userMembershipsCache = caches.userMemberships

    if (options.config.hasOwnProperty('defaultUsers')) {
      async.forEachOf(

        options.config.defaultUsers,

        function (roles, userId, cb) {
          _this.ensureUserRoles(
            userId,
            roles,
            cb
          )
        },

        callback
      )
    } else {
      callback(null)
    }
  }

  /**
   * Ensures that the specified user has been assigned the specified roles
   * @param {string} userId A userId for which the provided roles will be assigned to
   * @param {Array<string>} roleIds An array of roleIds that should be assigned to the user
   * @param {Function} callback Called with a standard error
   * @returns {undefined}
   * @example
   * users.ensureUserRoles(
   *   'Dave',
   *   ['fbotTest_fbotTestAdmin'],
   *   function (err) {
   *     // Expect err to be null
   *   }
   * )
   */
  ensureUserRoles (userId, roleIds, callback) {
    const _this = this

    if (_.isArray(roleIds)) {
      async.forEach(
        roleIds,

        function (roleId, cb) {
          _this.roleMembershipModel.upsert(
            {
              roleId: roleId,
              memberType: 'user',
              memberId: userId
            },
            {},
            cb
          )
        },

        callback
      )
    } else {
      callback(null)
    }
  }

  /**
   * Returns with all the roles currently assigned to the specified userId
   * @param {string} userId Specifies which useId to return a list of roles for
   * @param {Function} callback Called with an array of roleId strings that are assigned to the specified userId
   * @returns {undefined}
   * @example
   * users.getUserRoles(
   *   'Dave',
   *   function (err, roles) {
   *     // roles === ['fbotTest_fbotTestAdmin']
   *   }
   * )
   */
  getUserRoles (userId, callback) {
    const _this = this

    let cachedRoles = this.userMembershipsCache.get(userId)

    if (_.isArray(cachedRoles)) {
      callback(null, cachedRoles)
    } else {
      this.roleMembershipModel.find(
        {
          where: {
            memberType: {equals: 'user'},
            memberId: {equals: userId}
          }
        },
        function (err, roles) {
          if (err) {
            callback(err)
          } else {
            cachedRoles = _.uniq(_.map(roles, 'roleId'))

            _this.userMembershipsCache.set(userId, cachedRoles)
            callback(null, cachedRoles)
          }
        }
      )
    }
  }

  /**
   * Resets the internal cache of users and their roles. Needs calling if things change in the fbot_roleMembership_1_0 model and similar.
   * @returns {undefined}
   * @example
   * users.getUserRoles(
   *   'Dave',
   *   function (err, roles) {
   *     // roles === ['fbotTest_fbotTestAdmin']
   *   }
   * )
   */
  resetCache () {
    this.userMembershipsCache.reset()
  }

  onAuthorizationHook (flobot, options, callback) {
    const _this = this
    const userId = options.userId

    this.getUserRoles(
      userId,
      function (err, roles) {
        if (err) {
          callback(err)
        } else {
          const action = options.action

          let flowId
          if (flobot) {
            flowId = flobot.flowId
          } else {
            flowId = options.flowId
          }

          const authorized = _this.rbac.checkRoleAuthorization(
            userId,
            flobot,
            roles,
            'flow',
            flowId,
            action)

          if (authorized) {
            callback(null)
          } else {
            callback(boom.forbidden('No roles permit this action'))
          }
        }
      }
    )
  }

  static userCreatableFlow (flow) {
    return flow.hasOwnProperty('instigators') && flow.instigators.indexOf('user') !== -1
  }

  /**
   * Returns a list of Flows a user has the correct credentials to start, along with any form-definitions they can interact with. Useful for client apps wanting to configure themselves around an individual.
   * @param {string} userId Specifies which useId to return a remit-object for
   * @param {Function} callback Called with a 'remit' object
   * @returns {undefined}
   * @example
   * users.calculateRemitForUser(
   *   'Dave',
   *   function (err, remit) {
   *     // remit is an object:
   *     //  flobotsUserCanCreate: []
   *     //  forms: {}
   *   }
   * )
   */
  calculateRemitForUser (userId, callback) {
    const _this = this

    const remit = {
      flobotsUserCanCreate: [], // TODO: Should this be 'flowsUserCanCreate'?
      forms: {}
    }

    let flow
    let stateId
    let formFillingState
    let form

    this.getUserRoles(
      userId,
      function (err, roles) {
        if (err) {
          callback(err)
        } else {
          let formFillingStates

          for (let flowId in _this.flows) {
            if (_this.flows.hasOwnProperty(flowId)) {
              flow = _this.flows[flowId]

              // Can this user create a Flobot for this flow?
              if (UsersService.userCreatableFlow(flow) && _this.rbac.checkRoleAuthorization(
                userId,
                {
                  userId: userId
                },
                roles,
                'flow',
                flowId,
                'startNewFlobot')
                ) {
                remit.flobotsUserCanCreate.push(
                  {
                    flowId: flowId,
                    label: flow.label,
                    description: flow.description
                  }
                )

                formFillingStates = flow.findStatesByClassName('formFilling')

                for (stateId in formFillingStates) {
                  formFillingState = formFillingStates[stateId]
                  form = _this.forms[formFillingState.formId]

                  if (form) {
                    remit.forms[formFillingState.formId] = {
                      label: form.label,
                      form: form.form,
                      schema: form.schema
                    }
                  } else {
                    console.log('WARNING: Flow ' + flowId + ' refers to an unknown formId ' + formFillingState.formId)
                  }
                }
              }
            }
          }
        }

        callback(null, remit)
      }
    )
  }
}

module.exports = {
  schema: schema,
  serviceClass: UsersService,
  bootAfter: ['caches', 'flobots', 'rbac']
}
