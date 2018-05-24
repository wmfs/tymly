const dottie = require('dottie')

class Rbac {
  constructor (data) {
    const roleIds = data.roles.map(r => r.roleId)
    const memberships = data.roleMemberships.filter(
      roleMember => roleIds.indexOf(roleMember.roleId) !== -1 && roleIds.indexOf(roleMember.memberId) !== -1
    )

    this.index = {}
    this.inherits = { }

    const inheritedBy = {
      '$owner': ['$owner'],
      '$everyone': ['$everyone'],
      '$authenticated': ['$authenticated']
    }

    for (const roleId of roleIds) {
      this.inherits[roleId] = inheritedRoles(roleId, memberships)
      inheritedBy[roleId] = superRoles(roleId, memberships)
    }

    for (const permission of data.permissions) {
      for (const allow of permission.allows) {
        const key = [
          'stateMachine',
          permission.stateMachineName,
          allow
        ].join('.')

        const roleList = dottie.get(this.index, key) || []
        const inheritList = inheritedBy[permission.roleId] || []

        roleList.push(...inheritList)

        dottie.set(this.index, key, roleList)
      }
    }
  } // constructor
}

function superRoles (rootRoleId, memberships) {
  const inherits = findSuperRoles(rootRoleId, memberships)
  const uniqueInherits = [rootRoleId, ...new Set(inherits)]
  return uniqueInherits
} // superRoles

function findSuperRoles (rootRoleId, memberships) {
  const inherits = []
  const applicableMemberships = memberships.filter(m => m.memberId === rootRoleId)
  for (const membership of applicableMemberships) {
    inherits.push(
      membership.roleId,
      ...findSuperRoles(membership.roleId, memberships)
    )
  }
  return inherits
} // findSuperRoles

function inheritedRoles (rootRoleId, memberships) {
  const inherited = findInheritedRoles(rootRoleId, memberships)
  const uniqueInherited = [rootRoleId, ...new Set(inherited), '$everyone']
  return uniqueInherited
} // inheritedRoles

function findInheritedRoles (rootRoleId, memberships) {
  const inherited = []
  const applicableMemberships = memberships.filter(m => m.roleId === rootRoleId)
  for (const membership of applicableMemberships) {
    inherited.push(
      membership.memberId,
      ...findInheritedRoles(membership.memberId, memberships)
    )
  }
  return inherited
} // findInheritedRoles

module.exports = Rbac
