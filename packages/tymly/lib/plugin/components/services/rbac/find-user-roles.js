const _ = require('lodash')

async function findUserRoles (userId, roleMembershipModel, rbac) {
  let roles = await roleMembershipModel.find({
    where: {
      memberType: {equals: 'user'},
      memberId: {equals: userId}
    }
  })

  roles = _.uniq(roles.map(r => r.roleId))
  const inheritedRoles = ['$everyone']

  roles.map(roleId => {
    Object.keys(rbac.inheritedBy).map(inheritedBy => {
      if (rbac.inheritedBy[inheritedBy].includes(roleId)) {
        inheritedRoles.push(inheritedBy)
      }
    })
  })
  roles = _.uniq(roles.concat(inheritedRoles))

  return roles
} // findUserRoles

module.exports = findUserRoles
