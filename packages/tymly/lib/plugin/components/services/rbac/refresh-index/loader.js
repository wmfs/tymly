module.exports = async function rbacDataLoader (
  roleModel,
  roleMembershipModel,
  permissionModel) {
  const roleMemberships =
    await roleMembershipModel.find({
      where: {
        memberType: {equals: 'role'}
      }
    })

  const permissions =
    await permissionModel.find({})

  const roles =
    await roleModel.find({})

  return { roleMemberships, permissions, roles }
} // rbacDataLoader
