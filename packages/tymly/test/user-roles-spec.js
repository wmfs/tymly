/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('./../lib')
const path = require('path')

describe('User-role tests', function () {
  // TODO: MORE! MORE! MORE!

  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, users, rbac

  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'

  it('should get the RBAC service for user-role testing purposes', function (done) {
    tymly.boot(
      {
        pluginPaths: [],

        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/website-blueprint')
        ],

        config: {

          staticRootDir: path.resolve(__dirname, './output'),

          auth: {
            secret: secret,
            audience: audience
          },

          caches: {
            userMemberships: {max: 500}
          }
        }

      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        users = tymlyServices.users
        rbac = tymlyServices.rbac
        done()
      }
    )
  })

  it('should ensure Mommy is the boss', () => {
    return rbac.ensureUserRoles(
      'mommy',
      ['tymlyTest_boss']
    )
  })

  it('should ensure Daddy is an admin', () => {
    return rbac.ensureUserRoles(
      'daddy',
      ['tymlyTest_tymlyTestAdmin']
    )
  })

  it('should ensure Lucy is a Team Leader', () => {
    return rbac.ensureUserRoles(
      'lucy',
      ['tymlyTest_tymlyTestReadOnly', 'tymlyTest_teamLeader']
    )
  })

  it('should ensure Molly is a developer', () => {
    return rbac.ensureUserRoles(
      'molly',
      ['tymlyTest_developer']
    )
  })

  it('should get Lucy\'s roles via storage', async () => {
    const roles = await users.getUserRoles('lucy')
    expect(roles).to.eql(['tymlyTest_tymlyTestReadOnly', 'tymlyTest_teamLeader', '$everyone', 'tymlyTest_developer'])
  })

  it('should get Lucy\'s roles via cache', async () => {
    const roles = await users.getUserRoles('lucy')
    expect(roles).to.eql(['tymlyTest_tymlyTestReadOnly', 'tymlyTest_teamLeader', '$everyone', 'tymlyTest_developer'])
  })

  it('should get Mommy\'s roles via storage', async () => {
    const roles = await users.getUserRoles('mommy')
    expect(roles).to.eql(['tymlyTest_boss', '$everyone', 'tymlyTest_developer', 'tymlyTest_teamLeader'])
  })

  it('should get Molly\'s roles via storage', async () => {
    const roles = await users.getUserRoles('molly')
    expect(roles).to.eql(['tymlyTest_developer', '$everyone'])
  })

  it('should get Daddy\'s roles via storage', async () => {
    const roles = await users.getUserRoles('daddy')
    expect(roles).to.eql(['tymlyTest_tymlyTestAdmin', '$everyone'])
  })

  it('should reset cache', function () {
    users.resetCache()
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
