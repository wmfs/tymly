/* eslint-env mocha */
const expect = require('chai').expect
const path = require('path')
const rimraf = require('rimraf')
const copydir = require('copy-dir')

const gatherPackages = require('../lib/gather_packages.js')
const readVersionNumbers = require('../lib/read_version_numbers.js')
const gitDetails = require('../lib/git_details.js')
const whereAndWhen = require('../lib/where_and_when.js')
const packPackages = require('../lib/pack_packages.js')
const createManifest = require('../lib/create_manifest.js')

const pristine = path.resolve(__dirname, './fixtures/packages')
const searchRoot = path.resolve(__dirname, './fixtures/working')

describe('Bundler tests', function () {
  before(() => {
    rimraf.sync(searchRoot)
    copydir.sync(pristine, searchRoot)
  })

  describe('Package gathering', () => {
    const tests = [
      [
        'one top level package',
        'simple-package',
        [{directory: '.'}]
      ],
      [
        'package with node_modules',
        'package-with-node-modules',
        [{directory: '.'}]
      ],
      [
        'nested including a directory to ignore',
        'nested-directory',
        [{directory: 'package-1'}, {directory: 'package-2'}]
      ]
    ]

    for (const [label, fixture, results] of tests) {
      it(label, () => {
        const packages = gatherPackages(path.join(searchRoot, fixture))

        expect(packages).to.deep.equal(results)
      }) // it ...
    } // for ...
  }) // gathering packages

  describe('Read version numbers', () => {
    const tests = [
      [
        'one top level package',
        'simple-package',
        [{directory: '.'}],
        [{directory: '.', name: 'simple-package', version: '1.0.0'}]
      ],
      [
        'package with node_modules',
        'package-with-node-modules',
        [{directory: '.'}],
        [{directory: '.', name: 'package-with-node-modules', version: '0.0.0'}]
      ],
      [
        'nested including a directory to ignore',
        'nested-directory',
        [{directory: 'package-1'}, {directory: 'package-2'}],
        [
          {directory: 'package-1', name: 'package-A', version: '1.0.5'},
          {directory: 'package-2', name: 'package-B', version: '1.0.9'}
        ]
      ]
    ]

    for (const [label, fixture, packages, results] of tests) {
      it(label, () => {
        const versions = readVersionNumbers(path.join(searchRoot, fixture), packages)

        expect(versions).to.deep.equal(results)
      }) // it ...
    } // for ...
  }) // version numbers

  it('Gather git details', () => {
    const gitDeets = gitDetails()
    expect(gitDeets.repository).to.match(/github.com/)
    expect(gitDeets.repository).to.match(/tymly/)
    expect(gitDeets.branch).to.be.a('string')
    expect(gitDeets.commit).to.match(/[0-9a-f]{7}/)
  }) // git details

  it('Where and when', () => {
    const ww = whereAndWhen()
    expect(ww.user).to.be.a('string')
    expect(ww.hostname).to.be.a('string')
    expect(ww.timestamp).to.match(/[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/)
  }) // where and when

  it('manifest', () => {
    const manifest = createManifest([
      {directory: 'package-1', name: 'package-A', version: '1.0.5'},
      {directory: 'package-2', name: 'package-B', version: '1.0.9'}
    ])

    expect(manifest).to.be.an('object')
    expect(manifest.packages).to.be.an('array')
    expect(manifest.packages.length).to.equal(2)
    expect(manifest.packages[0]).to.deep.equal({'package-A': '1.0.5'})
    expect(manifest.git).to.be.an('object')
    expect(manifest.user).to.be.a('string')
    expect(manifest.hostname).to.be.a('string')
    expect(manifest.timestamp).to.be.a('string')
  })

  describe('Bundling up a deployment', function () {
    const tests = [
      [
        'one top level package',
        'simple-package',
        [{directory: '.', name: 'simple-package', version: '1.0.0'}],
        ['simple-package-1.0.0.tgz']
      ],
      [
        'package with node_modules',
        'package-with-node-modules',
        [{directory: '.', name: 'package-with-node-modules', version: '0.0.0'}],
        ['package-with-node-modules-0.0.0.tgz']
      ],
      [
        'nested including a directory to ignore',
        'nested-directory',
        [
          {directory: 'package-1', name: 'package-A', version: '1.0.5'},
          {directory: 'package-2', name: 'package-B', version: '1.0.9'}
        ],
        ['package-1/package-A-1.0.5.tgz', 'package-2/package-B-1.0.9.tgz']
      ]

    ]

    for (const [label, fixture, packages, expectedTarballs] of tests) {
      describe(label, function () {
        this.timeout(10000)

        it('pack up each package', async () => {
          const tarballs = await packPackages(path.join(searchRoot, fixture), packages)

          expect(tarballs).to.deep.equal(expectedTarballs)
        })
      }) // describe ...
    } // for ...
  }) // bundling for deploy
})
