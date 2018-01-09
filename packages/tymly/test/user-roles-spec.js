/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('./../lib')
const path = require('path')

describe('User-role tests', function () {
  // TODO: MORE! MORE! MORE!

  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let users
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
        done()
      }
    )
  })

  it('should ensure Mommy is the boss', function (done) {
    expect(
      users.ensureUserRoles(
        'mommy',
        ['tymlyTest_boss'],
        function (err) {
          expect(err).to.eql(null)
          done()
        })
    )
  })

  it('should ensure Daddy is an admin', function (done) {
    expect(
      users.ensureUserRoles(
        'daddy',
        ['tymlyTest_tymlyTestAdmin'],
        function (err) {
          expect(err).to.eql(null)
          done()
        })
    )
  })

  it('should ensure Lucy is a Team Leader', function (done) {
    expect(
      users.ensureUserRoles(
        'lucy',
        ['tymlyTest_tymlyTestReadOnly', 'tymlyTest_teamLeader'],
        function (err) {
          expect(err).to.eql(null)
          done()
        })
    )
  })

  it('should ensure Molly is a developer', function (done) {
    expect(
      users.ensureUserRoles(
        'molly',
        ['tymlyTest_developer'],
        function (err) {
          expect(err).to.eql(null)
          done()
        })
    )
  })

  it("should get Lucy's roles via storage", function (done) {
    expect(
      users.getUserRoles(
        'lucy',
        function (err, roles) {
          expect(err).to.eql(null)
          expect(roles).to.eql([ 'tymlyTest_tymlyTestReadOnly', 'tymlyTest_teamLeader' ])
          done()
        })
    )
  })

  it("should get Lucy's roles via cache", function (done) {
    expect(
      users.getUserRoles(
        'lucy',
        function (err, roles) {
          expect(err).to.eql(null)
          expect(roles).to.eql([ 'tymlyTest_tymlyTestReadOnly', 'tymlyTest_teamLeader' ])
          done()
        })
    )
  })

  it('should reset cache', function () {
    users.resetCache()
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
