/* eslint-env mocha */
const expect = require('chai').expect
const path = require('path')

const gatherPackages = require('../lib/gather_packages.js')
const readVersionNumbers = require('../lib/read_version_numbers.js')

const searchRoot = path.resolve(__dirname, './fixtures/packages')

describe('Package gathering', () => {
  const tests = [
    ['one top level package', 'simple-package', ['simple-package']],
    ['package with node_modules', 'package-with-node-modules', ['package-with-node-modules']],
    ['nested including a directory to ignore', 'nested-directory', ['package-1', 'package-2']]
  ]

  for (const [ label, fixture, results ] of tests) {
    it(`Walk directory, ${label}`, async () => {
      const packages = await gatherPackages(path.join(searchRoot, fixture))

      expect(packages).to.deep.equal(results)
    }) // it ...
  } // for ...
}) // describe ...

describe('Generate manifest version numbers', () => {
  const tests = [
    ['one top level package', ['simple-package'], {'simple-package': '1.0.0'}],
    ['package with node_modules', ['package-with-node-modules'], {'package-with-node-modules': '0.0.0'}],
    ['nested including a directory to ignore', ['nested-directory/package-1', 'nested-directory/package-2'], {'package-A': '1.0.a', 'package-B': '1.0.b'}]
  ]

  for (const [ label, packages, results ] of tests) {
    it(label, async () => {
      const versions = await readVersionNumbers(searchRoot, packages)

      expect(versions).to.deep.equal(results)
    }) // it ...
  } // for ...

}) // describe