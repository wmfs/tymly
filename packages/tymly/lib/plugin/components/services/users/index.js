'use strict'

const _ = require('lodash')
const async = require('async')
const schema = require('./schema.json')
const boom = require('boom')
const debug = require('debug')('users')

class UsersService {
  boot (options, callback) {
    const _this = this
    this.messages = options.messages

    this.rbac = options.bootedServices.rbac
    this.statebox = options.bootedServices.statebox
    this.stateMachines = this.statebox.stateMachines

    if (options.bootedServices.hasOwnProperty('forms')) {
      // TODO: This is grim. Should be a hook?
      this.forms = options.bootedServices.forms.forms
    }

    this.roleMembershipModel = options.bootedServices.storage.models.tymly_roleMembership
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
   *   ['tymlyTest_tymlyTestAdmin'],
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
          debug(`Adding user '${userId}' into role '${roleId}'`)
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
   *     // roles === ['tymlyTest_tymlyTestAdmin']
   *   }
   * )
   */
  getUserRoles (userId, callback) {
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
        (err, roles) => {
          if (err) return callback(err)
          cachedRoles = _.uniq(_.map(roles, 'roleId'))

          const inhertiedRoles = ['$everyone']
          cachedRoles.map(roleId => {
            Object.keys(this.rbac.rbac.inherits).map(inheritedBy => {
              if (this.rbac.rbac.inherits[inheritedBy].includes(roleId)) {
                inhertiedRoles.push(inheritedBy)
              }
            })
          })
          cachedRoles = _.uniq(cachedRoles.concat(inhertiedRoles))
          this.userMembershipsCache.set(userId, cachedRoles)
          callback(null, cachedRoles)
        }
      )
    }
  }

  /**
   * Resets the internal cache of users and their roles. Needs calling if things change in the tymly_roleMembership_1_0 model and similar.
   * @returns {undefined}
   * @example
   * users.getUserRoles(
   *   'Dave',
   *   function (err, roles) {
   *     // roles === ['tymlyTest_tymlyTestAdmin']
   *   }
   * )
   */
  resetCache () {
    this.userMembershipsCache.reset()
  }

  onAuthorizationHook (executionDescription, options, callback) {
    const _this = this
    const userId = options.userId

    this.getUserRoles(
      userId,
      function (err, roles) {
        if (err) {
          callback(err)
        } else {
          const action = options.action

          let stateMachineName
          if (executionDescription) {
            stateMachineName = executionDescription.stateMachineName
          } else {
            stateMachineName = executionDescription.stateMachineName
          }

          const authorized = _this.rbac.checkRoleAuthorization(
            userId,
            executionDescription,
            roles,
            'flow',
            stateMachineName,
            action)

          if (authorized) {
            callback(null)
          } else {
            callback(boom.forbidden('No roles permit this action', {
              userId: userId,
              stateMachineName: stateMachineName
            }))
          }
        }
      }
    )
  }

  static userCreatableFlow (stateMachine) {
    return _.isArray(stateMachine.definition.instigators) && stateMachine.definition.instigators.indexOf('user') !== -1
  }

  /**
   * Returns a list of state-machines a user has the correct credentials to start, along with any form-definitions they can interact with. Useful for client apps wanting to configure themselves around an individual.
   * @param {string} userId Specifies which useId to return a remit-object for
   * @param {Function} callback Called with a 'remit' object
   * @returns {undefined}
   * @example
   * users.calculateRemitForUser(
   *   'Dave',
   *   function (err, remit) {
   *     // remit is an object:
   *     //  stateMachinesUserCanStart: []
   *     //  forms: {}
   *   }
   * )
   */
  calculateRemitForUser (userId, callback) {
    const _this = this

    const remit = {
      stateMachinesUserCanStart: [],
      forms: {}
    }

    this.getUserRoles(
      userId,
      function (err, roles) {
        if (err) {
          callback(err)
        } else {
          const formFillingStates = _this.statebox.findStates(
            {
              resourceToFind: 'module:formFilling'
            }
          )

          let firstError

          formFillingStates.forEach(
            function (state) {
              const stateMachineName = state.stateMachine.name
              if (
                UsersService.userCreatableFlow(state.stateMachine) &&
                _this.rbac.checkRoleAuthorization(
                  userId,
                  {}, // Context {userId: userId},
                  roles,
                  'stateMachine',
                  stateMachineName,
                  'create'
                )) {
                remit.stateMachinesUserCanStart.push(
                  {
                    stateMachineName: stateMachineName,
                    label: stateMachineName,
                    description: state.stateMachine.definition.Comment || 'No comment?'
                  }
                )

                const formId = state.definition.ResourceConfig.formId
                const form = _this.forms[formId]

                if (form) {
                  remit.forms[formId] = {
                    label: form.label,
                    form: form.form,
                    schema: form.schema
                  }
                } else {
                  if (!firstError) {
                    firstError = new Error(`State machine '${stateMachineName}' refers to an unknown formId '${formId}'`)
                  }
                }
              }
            }
          )
          if (firstError) {
            callback(firstError)
          } else {
            callback(null, remit)
          }
        }
      }
    )
  }
}

module.exports = {
  schema: schema,
  serviceClass: UsersService,
  bootAfter: ['caches', 'statebox', 'rbac']
}
