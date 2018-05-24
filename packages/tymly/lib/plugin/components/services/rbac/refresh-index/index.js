'use strict'

const Rbac = require('./Rbac')

module.exports = async function refreshRbacIndex (
  roleModel,
  roleMembershipModel,
  permissionModel) {
  const data = await loader(
    roleModel,
    roleMembershipModel,
    permissionModel
  )

  return new Rbac(data)
} // refreshRbacIndex

async function loader (
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
} // loader

