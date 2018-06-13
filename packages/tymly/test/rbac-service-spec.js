/* eslint-env mocha */

const expect = require('chai').expect
const tymly = require('./../lib')
const path = require('path')
const RbacIndex = require('../lib/plugin/components/services/rbac/refresh-index/Rbac')

xdescribe('RBAC service tests', function () {
  // TODO: MORE! MORE! MORE!

  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let rbac

  describe('rbac index', () => {
    it('verify simple index', () => {
      const rbac = new RbacIndex(
        {
          'roleMemberships': [],
          'permissions': [
            {
              'stateMachineName': '*',
              'roleId': 'tymlyTest_tymlyTestAdmin',
              'allows': [ '*' ]
            },
            {
              'stateMachineName': 'tymlyTest_aDayInTheLife',
              'roleId': '$authenticated',
              'allows': [ '*' ]
            },
            {
              'stateMachineName': 'tymlyTest_generateUuid',
              'roleId': '$authenticated',
              'allows': [ '*' ]
            },
            {
              'stateMachineName': 'tymlyTest_runCallbackFunction',
              'roleId': '$authenticated',
              'allows': [ '*' ]
            },
            {
              'stateMachineName': 'tymlyTest_runFunction',
              'roleId': '$authenticated',
              'allows': [ '*' ]
            },
            {
              'stateMachineName': 'tymlyTest_runUnknownFunction',
              'roleId': '$authenticated',
              'allows': [
                '*'
              ]
            }
          ],
          'roles': [
            {
              'roleId': 'tymlyTest_tymlyTestAdmin',
              'label': 'tymlyTest Admin',
              'description': 'Do anything in the TymlyTest namespace'
            }
          ]
        }
      )

      expect(rbac.index).to.be.eql(
        {
          'stateMachine': {
            '*': {
              '*': [ 'tymlyTest_tymlyTestAdmin' ]
            },
            'tymlyTest_aDayInTheLife': {
              '*': [ '$authenticated' ]
            },
            'tymlyTest_generateUuid': {
              '*': [ '$authenticated' ]
            },
            'tymlyTest_runCallbackFunction': {
              '*': [ '$authenticated' ]
            },
            'tymlyTest_runFunction': {
              '*': [ '$authenticated' ]
            },
            'tymlyTest_runUnknownFunction': {
              '*': [ '$authenticated' ]
            }
          }
        }
      )
      expect(rbac.inherits).to.be.eql(
        {
          'tymlyTest_tymlyTestAdmin': [ 'tymlyTest_tymlyTestAdmin', '$everyone' ]
        }
      )
    })
    it('verify index', () => {
      const rbac = new RbacIndex(
        {
          'roleMemberships': [
            {
              'roleId': 'tymlyTest_boss',
              'memberType': 'role',
              'memberId': 'tymlyTest_teamLeader'
            },
            {
              'roleId': 'tymlyTest_teamLeader',
              'memberType': 'role',
              'memberId': 'tymlyTest_developer'
            }
          ],
          'permissions': [
            {
              'stateMachineName': 'tymlyTest_purgeSite_1_0',
              'roleId': 'tymlyTest_boss',
              'allows': [ 'create' ]
            },
            {
              'stateMachineName': 'tymlyTest_deletePost_1_0',
              'roleId': 'tymlyTest_boss',
              'allows': [ 'cancel' ]
            },
            {
              'stateMachineName': 'tymlyTest_createPost_1_0',
              'roleId': 'tymlyTest_developer',
              'allows': [ 'cancel' ]
            },
            {
              'stateMachineName': 'tymlyTest_deletePost_1_0',
              'roleId': 'tymlyTest_teamLeader',
              'allows': [ 'create' ]
            },
            {
              'stateMachineName': '*',
              'roleId': 'tymlyTest_tymlyTestAdmin',
              'allows': [ '*' ]
            },
            {
              'stateMachineName': '*',
              'roleId': 'tymlyTest_tymlyTestReadOnly',
              'allows': [ 'get' ]
            },
            {
              'stateMachineName': 'tymlyTest_createPost_1_0',
              'roleId': '$authenticated',
              'allows': [ 'create' ]
            },
            {
              'stateMachineName': 'tymlyTest_readPost_1_0',
              'roleId': '$everyone',
              'allows': [ 'create' ]
            },
            {
              'stateMachineName': 'tymlyTest_updatePost_1_0',
              'roleId': '$owner',
              'allows': [ 'create' ]
            }
          ],
          'roles': [
            { 'roleId': 'tymlyTest_boss' },
            { 'roleId': 'tymlyTest_developer' },
            { 'roleId': 'tymlyTest_teamLeader' },
            { 'roleId': 'tymlyTest_tymlyTestAdmin' },
            { 'roleId': 'tymlyTest_tymlyTestReadOnly' }
          ]
        }
      )

      expect(rbac.index).to.be.eql({
        'stateMachine': {
          '*': {
            '*': [ 'tymlyTest_tymlyTestAdmin' ],
            'get': [ 'tymlyTest_tymlyTestReadOnly' ]
          },
          'tymlyTest_createPost_1_0': {
            'cancel': [ 'tymlyTest_developer', 'tymlyTest_teamLeader', 'tymlyTest_boss' ],
            'create': [ '$authenticated' ]
          },
          'tymlyTest_deletePost_1_0': {
            'cancel': [ 'tymlyTest_boss' ],
            'create': [ 'tymlyTest_teamLeader', 'tymlyTest_boss' ]
          },
          'tymlyTest_purgeSite_1_0': {
            'create': [ 'tymlyTest_boss' ]
          },
          'tymlyTest_readPost_1_0': {
            'create': [ '$everyone' ]
          },
          'tymlyTest_updatePost_1_0': {
            'create': [ '$owner' ]
          }
        }
      })
      expect(rbac.inherits).to.be.eql({
        'tymlyTest_boss': [ 'tymlyTest_boss', 'tymlyTest_teamLeader', 'tymlyTest_developer', '$everyone' ],
        'tymlyTest_developer': [ 'tymlyTest_developer', '$everyone' ],
        'tymlyTest_teamLeader': [ 'tymlyTest_teamLeader', 'tymlyTest_developer', '$everyone' ],
        'tymlyTest_tymlyTestAdmin': [ 'tymlyTest_tymlyTestAdmin', '$everyone' ],
        'tymlyTest_tymlyTestReadOnly': [ 'tymlyTest_tymlyTestReadOnly', '$everyone' ]
      })
    })
  })

  describe('setup', () => {
    it('should get the ACL service for testing purposes', function (done) {
      tymly.boot(
        {
          pluginPaths: [],
          blueprintPaths: [
            path.resolve(__dirname, './fixtures/blueprints/website-blueprint')
          ],

          config: {
            caches: {
              userMemberships: {max: 500}
            }
          }
        },
        function (err, tymlyServices) {
          expect(err).to.eql(null)
          tymlyService = tymlyServices.tymly
          rbac = tymlyServices.rbac
          rbac.debug()
          done()
        }
      )
    })
  })

  describe('checkRoleAuthorization', () => {
    it('Should authorize something $everyone can do', function () {
      expect(
        rbac.checkRoleAuthorization(
          null, // userId
          null, // ctx
          [], // roles
          'stateMachine', // resourceType
          'tymlyTest_readPost_1_0', // resourceName
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
          'tymlyTest_createPost_1_0', // resourceName
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
          'tymlyTest_createPost_1_0', // resourceName
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
          'tymlyTest_updatePost_1_0', // resourceName
          'create' // action
        )).to.equal(true)
    })

    it('Should authorize something directly allowed via a role', function () {
      expect(
        rbac.checkRoleAuthorization(
          'john.doe', // userId
          null, // ctx
          ['tymlyTest_developer'], // roles
          'stateMachine', // resourceType
          'tymlyTest_createPost_1_0', // resourceName
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
          'tymlyTest_createPost_1_0', // resourceName
          'cancel' // action
        )).to.equal(false)
    })

    it('Should deny if no appropriate role', function () {
      expect(
        rbac.checkRoleAuthorization(
          null, // userId
          null, // ctx
          ['tymly_developer'], // roles
          'stateMachine', // resourceType
          'tymlyTest_deletePost_1_0', // resourceName
          'create' // action
        )).to.equal(false)
    })

    it('Should authorize something because of role inheritance', function () {
      expect(
        rbac.checkRoleAuthorization(
          null, // userId
          null, // ctx
          ['tymlyTest_boss'], // roles
          'stateMachine', // resourceType
          'tymlyTest_createPost_1_0', // resourceName
          'cancel' // action
        )).to.equal(true)
    })

    it('Should authorize something with resource and action wildcards', function () {
      expect(
        rbac.checkRoleAuthorization(
          'molly', // userId
          null, // ctx
          ['tymlyTest_tymlyTestAdmin'], // roles
          'stateMachine', // resourceType
          'tymlyTest_purgeSite_1_0', // resourceName
          'create' // action
        )).to.equal(true)
    })

    it('Should authorize something with just an action wildcard', function () {
      expect(
        rbac.checkRoleAuthorization(
          'molly', // userId
          null, // ctx
          ['tymlyTest_tymlyTestReadOnly'], // roles
          'stateMachine', // resourceType
          'tymlyTest_purgeSite_1_0', // resourceName
          'get' // action
        )).to.equal(true)
    })

    it('Should fail to authorize if irrelevant action wildcard', function () {
      expect(
        rbac.checkRoleAuthorization(
          'molly', // userId
          null, // ctx
          ['tymlyTest_tymlyTestReadOnly'], // roles
          'stateMachine', // resourceType
          'tymlyTest_purgeSite_1_0', // resourceName
          'create' // action
        )).to.equal(false)
    })
  })

  describe('getUserRoles', () => {
    const allUserRoles = [
      [
        'mommy',
        ['tymlyTest_boss'],
        ['tymlyTest_boss', 'tymlyTest_teamLeader', 'tymlyTest_developer', '$everyone']
      ],
      [
        'daddy',
        ['tymlyTest_tymlyTestAdmin'],
        ['tymlyTest_tymlyTestAdmin', '$everyone']
      ],
      [
        'lucy',
        ['tymlyTest_tymlyTestReadOnly', 'tymlyTest_teamLeader'],
        ['tymlyTest_tymlyTestReadOnly', '$everyone', 'tymlyTest_teamLeader', 'tymlyTest_developer']
      ],
      [
        'molly',
        ['tymlyTest_developer'],
        ['tymlyTest_developer', '$everyone']
      ],
      [
        'just-some-dude',
        null,
        ['$everyone']
      ]
    ]

    for (const [user, roles] of allUserRoles) {
      it(`ensure ${user} roles`, async () => {
        await rbac.ensureUserRoles(user, roles)
      })
    }

    for (const [user, , expectedRoles] of allUserRoles) {
      it(`verify ${user} roles via storage`, async () => {
        const roles = await rbac.getUserRoles(user)
        expect(roles).to.eql(expectedRoles)
      })
      it(`verify ${user} roles via cache`, async () => {
        const roles = await rbac.getUserRoles(user)
        expect(roles).to.eql(expectedRoles)
      })
    } // for ...
  })

  describe('shutdown', () => {
    it('should reset cache', function () {
      rbac.resetCache()
    })

    it('should shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })
  })
})
