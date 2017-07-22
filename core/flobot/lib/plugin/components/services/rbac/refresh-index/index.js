'use strict'

const loader = require('./loader')
const Rbac = require('./Rbac')

module.exports = function refreshRbacIndex (callback) {
  this.messages.info('Refreshing RBAC index')

  loader(
    this.roleModel,
    this.roleMembershipModel,
    this.permissionModel,

    function (err, data) {
      if (err) {
        callback(err)
      } else {
        callback(null, new Rbac(data))
      }
    }
  )
}
