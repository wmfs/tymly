/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect

describe('Simple Inventory tests', function () {
  const flobot = require('../lib')
  let inventoryService
  const blueprintPaths = [path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')]
  const pluginPaths = [
    path.resolve(__dirname, './fixtures/plugins/cats-plugin')
  ]
  this.timeout(5000)

  it('should boot with an inventory service', function (done) {
    flobot.boot(
      {
        blueprintPaths: blueprintPaths,
        pluginPaths: pluginPaths
      },
      function (err, flobotServices) {
        expect(err).to.eql(null)
        inventoryService = flobotServices.inventory
        done()
      }
    )
  })

  it('should return inventory contents', function (done) {
    inventoryService.collateEverything(
      {
        blueprintPaths: blueprintPaths,
        pluginPaths: pluginPaths
      },
      function (err, inventory) {
        expect(err).to.eql(null)
        expect(inventory).to.be.an('object')
        expect(inventory.states.purring).to.be.an('array')
        done()
      }
    )
  })
})
