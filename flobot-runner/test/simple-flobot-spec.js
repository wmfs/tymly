/* eslint-env mocha */

const path = require('path')
const expect = require('chai').expect
const process = require('process')

describe('Simple Flobot test', function () {
  this.timeout(5000)

  it('should run with valid blueprint and plugin paths', function (done) {
    process.env.FLOBOT_BLUEPRINTS_PATH = path.resolve(__dirname, './fixtures/blueprints/cats-blueprint')
    process.env.FLOBOT_PLUGINS_PATH = path.resolve(__dirname, './fixtures/plugins/cats-plugin')
    let flobotRunner = require('./../lib')
    expect(flobotRunner).to.be.an('object')
    done()
  })
})
