/* eslint-env mocha */

const expect = require('chai').expect

const RbacIndex = require('../lib/plugin/components/services/rbac/refresh-index/Rbac')

describe('rbac index', () => {
  it('verify index', () => {
    const rbac = new RbacIndex(
      {
        'roleMemberships': [],
        'permissions': [
          {
            'stateMachineName': '*',
            'roleId': 'tymlyTest_tymlyTestAdmin',
            'allows': [
              '*'
            ]
          },
          {
            'stateMachineName': 'tymlyTest_aDayInTheLife',
            'roleId': '$authenticated',
            'allows': [
              '*'
            ]
          },
          {
            'stateMachineName': 'tymlyTest_generateUuid',
            'roleId': '$authenticated',
            'allows': [
              '*'
            ]
          },
          {
            'stateMachineName': 'tymlyTest_runCallbackFunction',
            'roleId': '$authenticated',
            'allows': [
              '*'
            ]
          },
          {
            'stateMachineName': 'tymlyTest_runFunction',
            'roleId': '$authenticated',
            'allows': [
              '*'
            ]
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
            '*': [
              'tymlyTest_tymlyTestAdmin'
            ]
          },
          'tymlyTest_aDayInTheLife': {
            '*': [
              '$authenticated'
            ]
          },
          'tymlyTest_generateUuid': {
            '*': [
              '$authenticated'
            ]
          },
          'tymlyTest_runCallbackFunction': {
            '*': [
              '$authenticated'
            ]
          },
          'tymlyTest_runFunction': {
            '*': [
              '$authenticated'
            ]
          },
          'tymlyTest_runUnknownFunction': {
            '*': [
              '$authenticated'
            ]
          }
        }
      }
    )
    expect(rbac.inherits).to.be.eql(
      {
        '$owner': [
          '$owner'
        ],
        '$everyone': [
          '$everyone'
        ],
        '$authenticated': [
          '$authenticated'
        ],
        'tymlyTest_tymlyTestAdmin': [
          'tymlyTest_tymlyTestAdmin'
        ]
      }
    )
  })
})
