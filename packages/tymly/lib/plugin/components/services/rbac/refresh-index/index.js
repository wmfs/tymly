'use strict'

const loader = require('./loader')
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
}
