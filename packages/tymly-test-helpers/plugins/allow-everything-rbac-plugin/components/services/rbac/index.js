const debug = require('debug')('rbac')

class DummyRbacService {
  boot (options, callback) {
    options.messages.info('Dummy RBAC Service - always say yes')
    callback(null)
  } // boot

  ensureUserRoles (userId, roleIds) { } // ensureUserRoles

  getUserRoles (userId) {
    return ['$everyone']
  } // getUserRoles

  checkRoleAuthorization (userId, ctx, roles, resourceType, resourceName, action) {
    const text = `User '${userId}' asking for '${action}' on ${resourceType} '${resourceName}'... ` +
      `\n\tAccess permitted - NO ACCESS CONTROL APPLIED`
    debug(text)
    return true
  } // checkRoleAuthorization

  resetCache () {
    this.userMembershipsCache.reset()
  }

  debug () {
    console.log('')
    console.log('Dummy RBAC Index')
    console.log('----------')
    console.log('Anything -> ALLOWED')
    console.log('')
  } // debug
} // RbacService

module.exports = {
  serviceClass: DummyRbacService,
  bootAfter: ['statebox', 'caches', 'storage']
}
