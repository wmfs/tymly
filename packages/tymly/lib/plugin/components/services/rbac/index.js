const { applyDefaultRoles, ensureUserRoles } = require('./apply-default-roles')
const applyDefaultBlueprintDocs = require('./apply-default-blueprint-docs')
const loadRbacIndex = require('./refresh-index')
const findUserRoles = require('./find-user-roles')
const checkRoleAuthorization = require('./check-role-authorization')

class RbacService {
  async boot (options, callback) {
    try {
      this.messages = options.messages
      this.roleModel = options.bootedServices.storage.models.tymly_role
      this.roleMembershipModel = options.bootedServices.storage.models.tymly_roleMembership
      this.permissionModel = options.bootedServices.storage.models.tymly_permission

      const caches = options.bootedServices.caches
      caches.defaultIfNotInConfig('userMemberships', 500)
      this.userMembershipsCache = caches.userMemberships

      this.messages.info('Applying default roles')
      await applyDefaultRoles(
        options.config.defaultUsers,
        this.roleMembershipModel
      )

      this.messages.info('Applying unknown Blueprint documents')
      await applyDefaultBlueprintDocs(
        options.bootedServices.blueprintDocs,
        options.blueprintComponents,
        this.roleModel,
        this.roleMembershipModel,
        this.permissionModel
      )

      await this.refreshRbacIndex()

      callback(null)
    } catch (err) {
      return callback(err)
    }
  } // boot

  async ensureUserRoles (userId, roleIds) {
    return ensureUserRoles(userId, roleIds, this.roleMembershipModel)
  } // ensureUserRoles

  async refreshRbacIndex () {
    this.messages.info('Refreshing RBAC index')
    this.rbac = await loadRbacIndex(
      this.roleModel,
      this.roleMembershipModel,
      this.permissionModel
    )
  }

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
    const uid = (typeof userId === 'string') ? userId : null
    return checkRoleAuthorization(uid, ctx, roles, resourceType, resourceName, action, this.rbac)
  } // checkRoleAuthorization

  resetCache () {
    this.userMembershipsCache.reset()
  }

  debug () {
    console.log('')
    console.log('RBAC Index')
    console.log('----------')

    for (const [domainName, domain] of Object.entries(this.rbac.index)) {
      for (const [stateMachineName, stateMachine] of Object.entries(domain)) {
        for (const [actionName, action] of Object.entries(stateMachine)) {
          const path = [domainName, stateMachineName, actionName, JSON.stringify(action)].join(' -> ')
          console.log('  ', path)
        }
      }
    }

    console.log('')
  } // debug
} // RbacService

module.exports = {
  serviceClass: RbacService,
  bootAfter: ['statebox', 'caches', 'storage']
}
