/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const flobot = require('./../lib')
const path = require('path')

describe('RBAC tests', function () {
  // TODO: MORE! MORE! MORE!

  this.timeout(5000)

  let users
  let rbac
  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'

  it('should get the ACL service for testing purposes', function (done) {
    flobot.boot(
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
      function (err, flobotServices) {
        expect(err).to.eql(null)
        rbac = flobotServices.rbac
        users = flobotServices.users
        rbac.rbac.debug()
        done()
      }
    )
  })

  it('Should authorize something $everyone can do', function () {
    expect(
      rbac.checkRoleAuthorization(
        null, // userId
        null, // ctx
        [], // roles
        'stateMachine', // resourceType
        'fbotTest_readPost_1_0', // resourceName
        'create' // action
      )).to.equal(true)
  })

  it('Should authorize something an $authenticated user can do', function () {
    expect(
      rbac.checkRoleAuthorization(
        'john.smith', // userId
        null, // ctx
        [], // roles
        'stateMachine', // resourceType
        'fbotTest_createPost_1_0', // resourceName
        'create' // action
      )).to.equal(true)
  })

  it('Should deny something if user is not authenticated, when they need to be', function () {
    expect(
      rbac.checkRoleAuthorization(
        undefined, // userId
        null, // ctx
        [], // roles
        'stateMachine', // resourceType
        'fbotTest_createPost_1_0', // resourceName
        'create' // action
      )).to.equal(false)
  })

  it('Should authorize an $owner', function () {
    expect(
      rbac.checkRoleAuthorization(
        'molly', // userId
        {userId: 'molly'}, // ctx
        [], // roles
        'stateMachine', // resourceType
        'fbotTest_updatePost_1_0', // resourceName
        'create' // action
      )).to.equal(true)
  })

  it('Should authorize something directly allowed via a role', function () {
    expect(
      rbac.checkRoleAuthorization(
        'john.doe', // userId
        null, // ctx
        ['fbotTest_developer'], // roles
        'stateMachine', // resourceType
        'fbotTest_createPost_1_0', // resourceName
        'cancel' // action
      )).to.equal(true)
  })

  it('Should deny if no matching role', function () {
    expect(
      rbac.checkRoleAuthorization(
        'john.doe', // userId
        null, // ctx
        ['spaceCadet', 'IRRELEVANT!'], // roles
        'stateMachine', // resourceType
        'fbotTest_createPost_1_0', // resourceName
        'cancel' // action
      )).to.equal(false)
  })

  it('Should deny if no appropriate role', function () {
    expect(
      rbac.checkRoleAuthorization(
        null, // userId
        null, // ctx
        ['fbot_developer'], // roles
        'stateMachine', // resourceType
        'fbotTest_deletePost_1_0', // resourceName
        'create' // action
      )).to.equal(false)
  })

  it('Should authorize something because of role inheritance', function () {
    expect(
      rbac.checkRoleAuthorization(
        null, // userId
        null, // ctx
        ['fbotTest_boss'], // roles
        'stateMachine', // resourceType
        'fbotTest_createPost_1_0', // resourceName
        'cancel' // action
      )).to.equal(true)
  })

  it('Should authorize something with resource and action wildcards', function () {
    expect(
      rbac.checkRoleAuthorization(
        'molly', // userId
        null, // ctx
        ['fbotTest_fbotTestAdmin'], // roles
        'stateMachine', // resourceType
        'fbotTest_purgeSite_1_0', // resourceName
        'create' // action
      )).to.equal(true)
  })

  it('Should authorize something with just an action wildcard', function () {
    expect(
      rbac.checkRoleAuthorization(
        'molly', // userId
        null, // ctx
        ['fbotTest_fbotTestReadOnly'], // roles
        'stateMachine', // resourceType
        'fbotTest_purgeSite_1_0', // resourceName
        'get' // action
      )).to.equal(true)
  })

  it('Should fail to authorize if irrelevant action wildcard', function () {
    expect(
      rbac.checkRoleAuthorization(
        'molly', // userId
        null, // ctx
        ['fbotTest_fbotTestReadOnly'], // roles
        'stateMachine', // resourceType
        'fbotTest_purgeSite_1_0', // resourceName
        'create' // action
      )).to.equal(false)
  })

  it('should reset cache', function () {
    users.resetCache()
  })
})
