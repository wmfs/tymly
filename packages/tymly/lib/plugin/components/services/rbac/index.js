const _ = require('lodash')
const dottie = require('dottie')
const debug = require('debug')('rbac')

const { applyDefaultRoles, ensureUserRoles } = require('./apply-default-roles')
const applyDefaultBlueprintDocs = require('./apply-default-blueprint-docs')
const loadRbacIndex = require('./refresh-index')
const findUserRoles = require('./find-user-roles')

class RbacService {
  async boot (options, callback) {
    try {
      this.roleModel = options.bootedServices.storage.models.tymly_role
      this.roleMembershipModel = options.bootedServices.storage.models.tymly_roleMembership
      this.permissionModel = options.bootedServices.storage.models.tymly_permission

      const caches = options.bootedServices.caches
      caches.defaultIfNotInConfig('userMemberships', 500)
      this.userMembershipsCache = caches.userMemberships

      options.messages.info('Applying default roles')
      await applyDefaultRoles(
        options.config.defaultUsers,
        this.roleMembershipModel
      )

      options.messages.info('Applying unknown Blueprint documents')
      await applyDefaultBlueprintDocs(
        options.bootedServices.blueprintDocs,
        options.blueprintComponents,
        this.roleModel,
        this.roleMembershipModel,
        this.permissionModel
      )

      options.messages.info('Refreshing RBAC index')
      this.rbac = await loadRbacIndex(
        this.roleModel,
        this.roleMembershipModel,
        this.permissionModel
      )

      callback(null)
    } catch (err) {
      return callback(err)
    }
  } // boot

  ensureUserRoles (userId, roleIds) {
    return ensureUserRoles(userId, roleIds, this.roleMembershipModel)
  } // ensureUserRoles

  /**
   * Returns with all the roles currently assigned to the specified userId
   * @param {string} userId Specifies which useId to return a list of roles for
   * @param {Function} callback Called with an array of roleId strings that are assigned to the specified userId
   * @returns {Promise<array of roles>}
   * @example
   * users.getUserRoles('Dave').then(roles => {
   *     // roles === ['tymlyTest_tymlyTestAdmin']
   *   }
   * )
   */
  async getUserRoles (userId) {
    const cachedRoles = this.userMembershipsCache.get(userId)
    if (Array.isArray(cachedRoles)) return cachedRoles

    const roles = await findUserRoles(userId, this.roleMembershipModel, this.rbac)
    this.userMembershipsCache.set(userId, roles)
    return roles
  } // getUserRoles

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
   * @param {Object} ctx A Tymly context (optional)
   * @param {Array<string>} roles An array of roleIds
   * @param {string} resourceType The type of resource to authorize against (e.g. `flow`)
   * @param {string} resourceName The name of the resource that the credentials are being checked against (e.g. `flow tymlyTest_cat_1_0 startNewTymly`)
   * @param {string} action And the name of action these credentials are wanting to perform (e.g. `startNewTymly`)
   * @returns {boolean} Indicates if the provided credentials allow the specified action to be applied to the named resource (`true`) or not (`false`)
   * @example
   * var allowed = rbac.getUserIdFromContext(
   *   'Dave', // userId
   *   null, // ctx
   *   ['tymlyTest_tymlyTestAdmin'], // roles
   *   'flow', // resourceType,
   *   'tymlyTest_cat_1_0', // resourceName,
   *   'startNewTymly' // action
   * ) // Returns true/false
   */
  checkRoleAuthorization (userId, ctx, roles, resourceType, resourceName, action) {
    const _this = this

    function getRequiredRoleList () {
      // What roles will allow this?

      const key = [
        resourceType,
        resourceName,
        action
      ].join('.')

      const unrestricted = dottie.get(_this.rbac.index, '*.*.*') || []
      const unrestrictedInADomain = dottie.get(_this.rbac.index, resourceType + '.*.*') || []
      const anyActionOnASpecificResource = dottie.get(_this.rbac.index, resourceType + '.' + resourceName + '.*') || []
      const anyDomainResourceForASpecificAction = dottie.get(_this.rbac.index, resourceType + '.*.' + action) || []
      const specific = dottie.get(_this.rbac.index, key) || []

      return _.uniq(
        unrestricted.concat(
          unrestrictedInADomain,
          anyActionOnASpecificResource,
          anyDomainResourceForASpecificAction,
          specific
        )
      )
    }

    function addDebug (requiredRoleList, result) {
      let text = `User '${userId}' is attempting to '${action}' on ${resourceType} '${resourceName}'... ` +
        `which requires one of these roles: ${JSON.stringify(requiredRoleList)}, and user has these roles: ${JSON.stringify(roles)}. `
      if (result) {
        text += 'Access permitted!'
      } else {
        text += 'Access denied!'
      }
      debug(text)
    }

    function checker (requiredRoleList) {
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
              // TODO: $owner is actually a finer-grained restriction over usual roles. Not this.
              const contextOwner = RbacService.getUserIdFromContext(ctx)
              if (requiredRoleList.indexOf('$owner') !== -1 && _.isString(contextOwner) && _.isString(userId) && (contextOwner === userId)) {
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

    const requiredRoleList = getRequiredRoleList()
    const result = checker(requiredRoleList)
    addDebug(requiredRoleList, result)
    return result
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

  resetCache () {
    this.userMembershipsCache.reset()
  }
}

module.exports = {
  serviceClass: RbacService,
  bootAfter: ['statebox', 'caches', 'storage']
}
