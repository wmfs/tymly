const dottie = require('dottie')

class Rbac {
  constructor (data) {
    this.index = {}

    const roleIds = data.roles.map(r => r.roleId)

    const memberships = data.roleMemberships.filter(
      roleMember => roleIds.indexOf(roleMember.roleId) !== -1 && roleIds.indexOf(roleMember.memberId) !== -1
    )

    this.inherits = {
      '$owner': ['$owner'],
      '$everyone': ['$everyone'],
      '$authenticated': ['$authenticated']
    }

    roleIds.forEach(roleId => {
      const roleList = [roleId]
      addSuperRoles(roleId, roleList, memberships)
      this.inherits[roleId] = roleList
    })

    data.permissions.forEach(permission => {
      permission.allows.forEach(allow => {
        const key = [
          'stateMachine',
          permission.stateMachineName,
          allow
        ].join('.')

        const roleList = dottie.get(this.index, key) || []
        const inheritList = this.inherits[permission.roleId] || []

        roleList.push(...inheritList)

        dottie.set(this.index, key, roleList)
      })
    })
  } // constructor
}

function addSuperRoles (rootRoleId, list, memberships) {
  memberships.forEach(membership => {
    if (membership.memberId === rootRoleId) {
      if (list.indexOf(membership.roleId) === -1) {
        list.push(membership.roleId)
        addSuperRoles(membership.roleId, list, memberships)
      }
    }
  })
} // addSuperRoles

module.exports = Rbac
