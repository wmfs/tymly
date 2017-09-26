'use strict'
const async = require('async')

module.exports = function applyBlueprintDocs (options, callback) {
  function makeTemplateRoleDoc (docId, docSource) {
    return {
      roleId: docId,
      label: docSource.label,
      description: docSource.description
    }
  }

  function makePermissionDoc (docId, docSource) {
    return {
      stateMachineName: docSource.stateMachineName,
      roleId: docSource.roleId,
      allows: docSource.allows
    }
  }

  function makeRoleMembershipDoc (docId, docSource) {
    return {
      roleId: docSource.templateRoleId,
      memberType: 'role',
      memberId: docSource.roleMemberId
    }
  }

  const blueprintDocs = options.bootedServices.blueprintDocs
  const roleModel = options.bootedServices.storage.models.fbot_role
  const roleMembershipModel = options.bootedServices.storage.models.fbot_roleMembership
  const permissionModel = options.bootedServices.storage.models.fbot_permission

  const docTasks = []

  options.messages.info('Applying unknown Blueprint documents')
  // Grab role-templates, default role-memberships and default role-grants
  // ---------------------------------------------------------------------

  let templateRole
  const templateRoles = options.blueprintComponents.templateRoles

  if (templateRoles) {
    for (let templateRoleId in templateRoles) {
      templateRole = templateRoles[templateRoleId]

      docTasks.push(
        {
          domain: 'templateRole',
          docId: templateRoleId,
          docSource: templateRole,
          dao: roleModel,
          docMaker: makeTemplateRoleDoc

        }
      )

      if (templateRole.hasOwnProperty('grants')) {
        templateRole.grants.forEach(
          function (grant) {
            const source = grant
            source.roleId = templateRoleId
            docTasks.push(
              {
                domain: 'roleGrant',
                docId: templateRoleId + '_' + grant.stateMachineName,
                docSource: source,
                dao: permissionModel,
                docMaker: makePermissionDoc
              }
            )
          }
        )
      }

      if (templateRole.hasOwnProperty('roleMemberships')) {
        templateRole.roleMemberships.forEach(
          function (roleMemberId) {
            docTasks.push(
              {
                domain: 'roleMembership',
                docId: templateRoleId + '_' + roleMemberId,
                docSource: {
                  templateRoleId: templateRoleId,
                  roleMemberId: templateRole.namespace + '_' + roleMemberId
                },
                dao: roleMembershipModel,
                docMaker: makeRoleMembershipDoc
              }
            )
          }
        )
      }
    }
  }

  // Grab restrictions from state machines
  // -------------------------------------

  let stateMachine
  const stateMachines = options.blueprintComponents.stateMachines
  if (stateMachines) {
    for (let stateMachineName in stateMachines) {
      stateMachine = stateMachines[stateMachineName]
      if (stateMachine.hasOwnProperty('restrictions')) {
        stateMachine.restrictions.forEach(
          function (restriction) {
            const source = restriction
            source.stateMachineName = stateMachineName

            docTasks.push(
              {
                domain: 'stateMachineRestriction',
                docId: stateMachineName + '_' + restriction.roleId,
                docSource: source,
                dao: permissionModel,
                docMaker: makePermissionDoc
              }
            )
          }
        )
      }
    }
  }

  const knownDocs = {}

  async.forEach(
    ['templateRole', 'roleGrant', 'stateMachineRestriction', 'roleMembership'],

    function (domain, cb) {
      blueprintDocs.getDomainDocIds(
        domain,
        function (err, docIds) {
          if (err) {
            cb(err)
          } else {
            knownDocs[domain] = docIds
            cb(null)
          }
        }
      )
    },

    function (err) {
      if (err) {
        callback(err)
      } else {
        // So now we have all the known docIds, grouped by domain, and all
        // docs required from the blueprints... so for all unknown docs, go make them.

        async.forEach(
          docTasks,
          function (task, cb) {
            if (knownDocs[task.domain].indexOf(task.docId) === -1) {
              // Unknown!
              const doc = task.docMaker(task.docId, task.docSource)
              task.dao.create(
                doc,
                {},
                function (err) {
                  if (err) {
                    cb(err)
                  } else {
                    blueprintDocs.registerDocument(
                      task.domain,
                      task.docId,
                      cb
                    )
                  }
                }
              )
            } else {
              // Known!
              cb(null)
            }
          },
          function (err) {
            if (err) {
              callback(err)
            } else {
              callback(null)
            }
          }
        )
      }
    }
  )
}
