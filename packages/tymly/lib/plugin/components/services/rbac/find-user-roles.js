async function findUserRoles (userId, roleMembershipModel, rbac) {
  const roleIds = await findRoleIds(userId, roleMembershipModel)

  const applicableRoles = []
  for (const roleId of roleIds) {
    const roles = rbac.inherits[roleId] || [roleId]

    applicableRoles.push(...roles)
  }
  applicableRoles.push('$everyone')

  return [...new Set(applicableRoles)] // uniqify
} // findUserRoles

async function findRoleIds (userId, roleMembershipModel) {
  const roles = await roleMembershipModel.find({
    where: {
      memberType: {equals: 'user'},
      memberId: {equals: userId}
    }
  })
  return roles.map(r => r.roleId)
} // findRoleIds

module.exports = findUserRoles
