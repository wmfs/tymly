'use strict'

const _ = require('lodash')
const dottie = require('dottie')

const refreshIndexModule = require('./refresh-index/index')

const applyDefaultBlueprintDocs = require('./apply-default-blueprint-docs')

class RbacService {
  boot (options, callback) {
    const _this = this

    this.messages = options.messages
    this.roleModel = options.bootedServices.storage.models.fbot_role
    this.roleMembershipModel = options.bootedServices.storage.models.fbot_roleMembership
    this.permissionModel = options.bootedServices.storage.models.fbot_permission

    applyDefaultBlueprintDocs(
      options,

      function (err) {
        if (err) {
          callback(err)
        } else {
          // Refresh RBAC index
          // ------------------
          _this.refreshIndex(callback)
        }
      }
    )
  }

  /**
   * Regenerates the internal RBAC index. Needs to be done to reflect any changes made to the underlying models (e.g. `fbot_permission_1_0`, `fbot_role_1_0` and `fbot_membership_1_0`)
   * @param {Function} callback Called with a standard error
   * @returns {undefined}
   * @example
   * rbac.refreshIndex(
   *   function (err) {
   *     // Would expect err to be null
   *   }
   * )
   */
  refreshIndex (callback) {
    const _this = this
    const f = refreshIndexModule.bind(this)
    f(
      function (err, rbac) {
        if (err) {
          callback(err)
        } else {
          _this.rbac = rbac
          _this.index = _this.rbac.index
          callback(null)
        }
      }
    )
  }

  static getUserIdFromContext (ctx) {
    let userId
    if (ctx && ctx.hasOwnProperty('userId')) {
      userId = ctx.userId
    }
    return userId
  }

  /**
   * Checks the supplied credentials against the internal RBAC index
   * @param {string} userId A userId to check (used for dynamic checks such as _'allow update as long as userId matches with the author of target document'_)
   * @param {Object} ctx A Flobot context (optional)
   * @param {Array<string>} roles An array of roleIds
   * @param {string} resourceType The type of resource to authorize against (e.g. `flow`)
   * @param {string} resourceName The name of the resource that the credentials are being checked against (e.g. `flow fbotTest_cat_1_0 startNewFlobot`)
   * @param {string} action And the name of action these credentials are wanting to perform (e.g. `startNewFlobot`)
   * @returns {boolean} Indicates if the provided credentials allow the specified action to be applied to the named resource (`true`) or not (`false`)
   * @example
   * var allowed = rbac.getUserIdFromContext(
   *   'Dave', // userId
   *   null, // ctx
   *   ['fbotTest_fbotTestAdmin'], // roles
   *   'flow', // resourceType,
   *   'fbotTest_cat_1_0', // resourceName,
   *   'startNewFlobot' // action
   * ) // Returns true/false
   */
  checkRoleAuthorization (userId, ctx, roles, resourceType, resourceName, action) {
    const key = [
      resourceType,
      resourceName,
      action
    ].join('.')

    // What roles will allow this?

    const unrestricted = dottie.get(this.index, '*.*.*') || []
    const unrestrictedInADomain = dottie.get(this.index, resourceType + '.*.*') || []
    const anyActionOnASpecificResource = dottie.get(this.index, resourceType + '.' + resourceName + '.*') || []
    const anyDomainResourceForASpecificAction = dottie.get(this.index, resourceType + '.*.' + action) || []
    const specific = dottie.get(this.index, key) || []

    const requiredRoleList = _.uniq(
      unrestricted.concat(
        unrestrictedInADomain,
        anyActionOnASpecificResource,
        anyDomainResourceForASpecificAction,
        specific
      )
    )

    if (requiredRoleList.length > 0) {
      if (requiredRoleList.indexOf('$everyone') !== -1) {
        return true
      } else {
        if (_.isString(userId) && requiredRoleList.indexOf('$authenticated') !== -1) {
          return true
        } else {
          let roleMatch = false

          for (let i = 0; i < roles.length; i++) {
            if (requiredRoleList.indexOf(roles[i]) !== -1) {
              roleMatch = true
              break
            }
          }

          if (roleMatch) {
            return true
          } else {
            // Allow if $owner...;
            const contextOwner = RbacService.getUserIdFromContext(ctx)

            if (contextOwner && userId && contextOwner === userId) {
              return true
            } else {
              return false
            }
          }
        }
      }
    } else {
      return false
    }
  }

  allRoles (roles) {
    const _this = this
    let allRoles = []

    roles.forEach(
      function (roleId) {
        allRoles = allRoles.concat(_this.rbac.inherits[roleId])
      }
    )

    return _.uniq(allRoles)
  }
}

module.exports = {
  serviceClass: RbacService,
  bootAfter: ['flobots', 'storage']
}
