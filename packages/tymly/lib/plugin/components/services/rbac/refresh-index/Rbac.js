'use strict'

const _ = require('lodash')
const dottie = require('dottie')

class Rbac {
  constructor (data) {
    const _this = this

    this.index = {}

    const roleNames = _.map(data.roles, 'roleId')

    const memberships = _.filter(
      data.roleMemberships,
      function (roleMember) {
        return roleNames.indexOf(roleMember.roleId) !== -1 && roleNames.indexOf(roleMember.memberId) !== -1
      }
    )

    this.inherits = {
      '$owner': ['$owner'],
      '$everyone': ['$everyone'],
      '$authenticated': ['$authenticated']
    }

    let roleList
    data.roles.forEach(
      function (role) {
        roleList = [role.roleId]
        _this.addSuperRoles(role.roleId, roleList, memberships)
        _this.inherits[role.roleId] = roleList
      }
    )

    let key
    let inheritList
    data.permissions.forEach(
      function (permission) {
        permission.allows.forEach(

          function (allow) {
            key = [
              'stateMachine',
              permission.stateMachineName,
              allow
            ].join('.')

            roleList = dottie.get(_this.index, key)

            if (!roleList) {
              roleList = []
            }

            inheritList = _this.inherits[permission.roleId]

            if (inheritList) {
              roleList = _.union(roleList, inheritList)
            }

            dottie.set(_this.index, key, roleList)
          }

        )
      }
    )
  }

  addSuperRoles (rootRoleId, list, memberships) {
    const _this = this
    memberships.forEach(
      function (membership) {
        if (membership.memberId === rootRoleId) {
          if (list.indexOf(membership.roleId) === -1) {
            list.push(membership.roleId)
            _this.addSuperRoles(membership.roleId, list, memberships)
          }
        }
      }
    )
  }

  debug () {
    console.log('')
    console.log('RBAC Index')
    console.log('----------')

    for (const domainName in this.index) {
      const domain = this.index[domainName]

      for (const stateMachineName in domain) {
        const stateMachine = domain[stateMachineName]

        for (const actionName in stateMachine) {
          const action = stateMachine[actionName]

          const path = [domainName, stateMachineName, actionName, JSON.stringify(action)].join(' -> ')
          console.log('  ', path)
        }
      }
    }

    console.log('')
  }
}

module.exports = Rbac
