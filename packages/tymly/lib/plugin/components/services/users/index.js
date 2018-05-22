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
  getUserRoles (userId, callback) {
    let cachedRoles = this.userMembershipsCache.get(userId)

    if (Array.isArray(cachedRoles)) {
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
}

module.exports = {
  schema: schema,
  serviceClass: UsersService,
  bootAfter: ['caches', 'rbac']
}
