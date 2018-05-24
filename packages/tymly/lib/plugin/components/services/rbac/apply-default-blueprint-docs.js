function makeTemplateRoleDoc (docId, docSource) {
  return {
    roleId: docId,
    label: docSource.label,
    description: docSource.description
  }
} // makeTemplateRoleDoc

function makePermissionDoc (docId, docSource) {
  return {
    stateMachineName: docSource.stateMachineName,
    roleId: docSource.roleId,
    allows: docSource.allows
  }
} // makePermissionDoc

function makeRoleMembershipDoc (docId, docSource) {
  return {
    roleId: docSource.templateRoleId,
    memberType: 'role',
    memberId: docSource.roleMemberId
  }
} // makeRoleMembershipDoc

function gatherRoleTemplates (templateRoles, roleModel, roleMembershipModel, permissionModel) {
  // Grab role-templates, default role-memberships and default role-grants
  // ---------------------------------------------------------------------

  const docTasks = []

  if (!templateRoles) {
    return docTasks
  }

  for (const [templateRoleId, templateRole] of Object.entries(templateRoles)) {
    docTasks.push({
      domain: 'templateRole',
      docId: templateRoleId,
      docSource: templateRole,
      dao: roleModel,
      docMaker: makeTemplateRoleDoc
    })

    for (const grant of (templateRole.grants || [])) {
      grant.roleId = templateRoleId
      docTasks.push({
        domain: 'roleGrant',
        docId: templateRoleId + '_' + grant.stateMachineName,
        docSource: grant,
        dao: permissionModel,
        docMaker: makePermissionDoc
      })
    }

    for (const roleMemberId of (templateRole.roleMemberships || [])) {
      docTasks.push({
        domain: 'roleMembership',
        docId: templateRoleId + '_' + roleMemberId,
        docSource: {
          templateRoleId: templateRoleId,
          roleMemberId: templateRole.namespace + '_' + roleMemberId
        },
        dao: roleMembershipModel,
        docMaker: makeRoleMembershipDoc
      })
    }
  }

  return docTasks
} // gatherRoleTemplates

function gatherStateMachineRestrictions (stateMachines, permissionModel) {
  // Grab restrictions from state machines
  // -------------------------------------

  const docTasks = []

  if (!stateMachines) {
    return docTasks
  }

  for (const [name, stateMachine] of Object.entries(stateMachines)) {
    for (const restriction of (stateMachine.restrictions || [])) {
      restriction.stateMachineName = name
      docTasks.push({
        domain: 'stateMachineRestriction',
        docId: name + '_' + restriction.roleId,
        docSource: restriction,
        dao: permissionModel,
        docMaker: makePermissionDoc
      })
    }
  }

  return docTasks
} // gatherStateMachineRestrictions

async function collectKnownDocs (blueprintDocs) {
  const knownDocs = {}
  const domains = ['templateRole', 'roleGrant', 'stateMachineRestriction', 'roleMembership']
  for (const domain of domains) {
    const docIds = await blueprintDocs.getDomainDocIds(domain)
    knownDocs[domain] = docIds
  }
  return knownDocs
} // collectKnownDocs

module.exports = async function applyBlueprintDocs (
  blueprintDocs,
  blueprintComponents,
  roleModel,
  roleMembershipModel,
  permissionModel) {
  const roleTemplateTasks = gatherRoleTemplates(
    blueprintComponents.templateRoles,
    roleModel,
    roleMembershipModel,
    permissionModel
  )

  const restrictionTasks = gatherStateMachineRestrictions(
    blueprintComponents.stateMachines,
    permissionModel
  )

  const docTasks = [...roleTemplateTasks, ...restrictionTasks]
  const knownDocs = await collectKnownDocs(blueprintDocs)

  // the known docIds, grouped by domain, and all
  // docs required from the blueprints... so for all unknown docs, go make them.
  for (const task of docTasks) {
    if (knownDocs[task.domain].indexOf(task.docId) === -1) {
      // Unknown!
      const doc = task.docMaker(task.docId, task.docSource)
      await task.dao.create(doc, {})
      await blueprintDocs.registerDocument(task.domain, task.docId)
    }
  }
}
