const _ = require('lodash')
const schema = require('./schema.json')

class UsersService {
  async boot (options, callback) {
    this.messages = options.messages

    this.rbac = options.bootedServices.rbac

    this.roleMembershipModel = options.bootedServices.storage.models.tymly_roleMembership
    const caches = options.bootedServices.caches
    caches.defaultIfNotInConfig('userMemberships', 500)
    this.userMembershipsCache = caches.userMemberships

    callback(null)
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
  async getUserRoles (userId) {
    const cachedRoles = this.userMembershipsCache.get(userId)
    if (Array.isArray(cachedRoles)) return cachedRoles

    return this.findAndCacheRoles(userId)
  } // getUserRoles

  async findAndCacheRoles (userId) {
    let roles = await this.roleMembershipModel.find({
      where: {
        memberType: {equals: 'user'},
        memberId: {equals: userId}
      }
    })

    roles = _.uniq(_.map(roles, 'roleId'))
    const inhertiedRoles = ['$everyone']

    roles.map(roleId => {
      Object.keys(this.rbac.rbac.inherits).map(inheritedBy => {
        if (this.rbac.rbac.inherits[inheritedBy].includes(roleId)) {
          inhertiedRoles.push(inheritedBy)
        }
      })
    })
    roles = _.uniq(roles.concat(inhertiedRoles))
    this.userMembershipsCache.set(userId, roles)
    return roles
  } // getUserRoles

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
}

module.exports = {
  schema: schema,
  serviceClass: UsersService,
  bootAfter: ['caches', 'rbac']
}
