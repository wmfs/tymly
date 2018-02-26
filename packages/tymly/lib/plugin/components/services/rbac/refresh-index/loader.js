'use strict'

const async = require('async')

module.exports = function rbacDataLoader (
  roleModel,
  roleMembershipModel,
  permissionModel,
  callback) {
  const data = {}

  const tasks = [
    function findAllRoleMemberships (cb) {
      roleMembershipModel.find(
        {
          where: {
            memberType: {equals: 'role'}
          }
        },
        function (err, roleMemberships) {
          if (err) {
            cb(err)
          } else {
            data.roleMemberships = roleMemberships
            cb(null)
          }
        }
      )
    },

    function findAllPermissions (cb) {
      permissionModel.find(
        {},
        function (err, permissions) {
          if (err) {
            cb(err)
          } else {
            data.permissions = permissions
            cb(null)
          }
        }
      )
    },

    function findAllRoles (cb) {
      roleModel.find(
        {},
        function (err, roles) {
          if (err) {
            cb(err)
          } else {
            data.roles = roles
            cb(null)
          }
        }
      )
    }
  ]

  async.parallel(
    tasks,
    function (err) {
      if (err) {
        callback(err)
      } else {
        callback(null, data)
      }
    }
  )
}
