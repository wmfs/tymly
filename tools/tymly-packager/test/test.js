/* eslint-env mocha */
const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect
const path = require('path')
const rimraf = require('rimraf')
const copydir = require('copy-dir')
const tar = require('../lib/tar_helpers')
const upath = require('upath')

const gatherPackages = require('../lib/gather_packages.js')
const readVersionNumbers = require('../lib/read_version_numbers.js')
const gitDetails = require('../lib/git_details.js')
const whereAndWhen = require('../lib/where_and_when.js')
const packPackages = require('../lib/pack_packages.js')
const createManifest = require('../lib/create_manifest.js')
const buildBundle = require('../lib/build_bundle.js')
const bundleForDeploy = require('../lib/bundler.js')

const pristineSource = path.resolve(__dirname, './fixtures/packages')
const pristineTarballs = path.resolve(__dirname, './fixtures/expected')
const searchRoot = path.resolve(__dirname, './fixtures/working')
const forDeployRoot = path.resolve(__dirname, './fixtures/for-deploy')

const allTestDirs = [ searchRoot, forDeployRoot ]

describe('Bundler tests', function () {
  before(() => {
    allTestDirs.forEach(d => rimraf.sync(d))
    allTestDirs.forEach(d => copydir.sync(pristineSource, d))
  })

  after(() => {
    allTestDirs.forEach(d => rimraf.sync(d))
  })

  describe('Package gathering', () => {
    const tests = [
      [
        'one top level package',
        'simple-package',
        [{directory: 'packages/simple-package', basename: 'simple-package'}]
      ],
      [
        'package with dependencies',
        'package-with-dependencies',
        [{directory: 'plugins/package-with-dependencies', basename: 'package-with-dependencies'}]
      ],
      [
        'includes a directory to ignore',
        'mixed',
        [
          {directory: 'packages/package-1', basename: 'package-1'},
          {directory: 'packages/package-2', basename: 'package-2'}
        ]
      ],
      [
        'packages with a dependency from one to another',
        'peer-dependency',
        [
          {directory: 'packages/package-master', basename: 'package-master'},
          {directory: 'packages/package-servant', basename: 'package-servant'}
        ]
      ]
    ]

    for (const [label, fixture, results] of tests) {
      it(label, () => {
        let packages = gatherPackages(upath.join(searchRoot, fixture))
        packages = upath.normalize(JSON.stringify(packages))
        expect(packages).to.deep.equal(JSON.stringify(results))
      }) // it ...
    } // for ...
  }) // gathering packages

  describe('Read version numbers', () => {
    const tests = [
      [
        'one top level package',
        'simple-package',
        [{directory: 'packages/simple-package'}],
        [{directory: 'packages/simple-package', name: 'simple-package', version: '1.0.0'}]
      ],
      [
        'package with dependencies',
        'package-with-dependencies',
        [{directory: 'plugins/package-with-dependencies'}],
        [{directory: 'plugins/package-with-dependencies', name: 'package-with-dependencies', version: '0.0.0'}]
      ],
      [
        'including a directory to ignore',
        'mixed',
        [{directory: 'packages/package-1'}, {directory: 'packages/package-2'}],
        [
          {directory: 'packages/package-1', name: 'package-A', version: '1.0.5'},
          {directory: 'packages/package-2', name: 'package-B', version: '1.0.9'}
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
    // expect(gitDeets.repository).to.match(/github.com/)
    expect(gitDeets.repository).to.match(/tymly/)
    expect(gitDeets.repository).to.not.endWith('\n')
    expect(gitDeets.branch).to.be.a('string')
    expect(gitDeets.branch).to.not.endWith('\n')
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
    expect(manifest.packages).to.be.an('object')
    expect(manifest.packages['package-A']).to.equal('1.0.5')
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
        [{directory: path.join('packages', 'simple-package'), basename: 'simple-package', name: 'simple-package', version: '1.0.0'}],
        [path.join('packages', 'simple-package', 'simple-package-1.0.0.tgz')],
        2
      ],
      [
        'package with dependencies',
        'package-with-dependencies',
        [{directory: path.join('plugins', 'package-with-dependencies'), basename: 'package-with-dependencies', name: 'package-with-dependencies', version: '0.0.0'}],
        [path.join('plugins', 'package-with-dependencies', 'package-with-dependencies-0.0.0.tgz')],
        30
      ],
      [
        'including a directory to ignore',
        'mixed',
        [
          {directory: path.join('packages', 'package-1'), basename: 'package-1', name: 'package-A', version: '1.0.5'},
          {directory: path.join('packages', 'package-2'), basename: 'package-2', name: 'package-B', version: '1.0.9'}
        ],
        [
          path.join('packages', 'package-1', 'package-A-1.0.5.tgz'),
          path.join('packages', 'package-2', 'package-B-1.0.9.tgz')
        ],
        3
      ],
      [
        'cross dependency',
        'peer-dependency',
        [
          {directory: path.join('packages', 'package-master'), basename: 'package-master', name: 'package-master', version: '1.0.5'},
          {directory: path.join('packages', 'package-servant'), basename: 'package-servant', name: 'package-servant', version: '1.0.0'}
        ],
        [
          path.join('packages', 'package-master', 'package-master-1.0.5.tgz'),
          path.join('packages', 'package-servant', 'package-servant-1.0.0.tgz')
        ],
        3
      ]

    ]

    for (const [label, fixture, packages, expectedTarballs, expectedFiles] of tests) {
      describe(label, function () {
        this.timeout(process.env.TIMEOUT || 5000)

        const fixtureRoot = path.join(searchRoot, fixture)

        it('pack up each package', async () => {
          const packagesWithTarballs = await packPackages(fixtureRoot, packages)
          const tarballs = packagesWithTarballs.map(pkg => pkg.tarball)

          expect(tarballs).to.deep.equal(expectedTarballs)
        })

        it('make the bundle', async () => {
          for (let t = 0; t !== expectedTarballs.length; ++t) {
            packages[t].tarball = expectedTarballs[t]
          }

          const [tarball, filesInBundle] = await buildBundle(fixtureRoot, packages)

          expect(filesInBundle).to.equal(expectedFiles)

          const deployFiles = await listEntries(tarball)
          const matchFiles = await listEntries(path.join(pristineTarballs, `${fixture}.tgz`))

          expect(deployFiles).to.have.same.members(matchFiles)
        })
      }) // describe ...
    } // for ...
  }) // bundling for deploy

  describe('Deploy', function () {
    const tests = [
      [
        'one top level package',
        'simple-package'
      ],
      [
        'package with dependencies',
        'package-with-dependencies'
      ],
      [
        'nested including a directory to ignore',
        'mixed'
      ],
      [
        'peer dependencies between packages',
        'peer-dependency'
      ]
    ]

    for (const [label, fixture] of tests) {
      describe(label, function () {
        this.timeout(process.env.TIMEOUT || 5000)

        const fixtureRoot = path.join(forDeployRoot, fixture)

        it(`bundle ${fixture} for deploy`, async () => {
          const tarball = await bundleForDeploy(fixtureRoot, fixture)

          const deployFiles = await listEntries(tarball)
          const matchFiles = await listEntries(path.join(pristineTarballs, `${fixture}.tgz`))

          expect(deployFiles).to.have.same.members(matchFiles)
        })
      }) // describe ...
    } // for ...
  }) // bundling for deploy
})

function listEntries (tarball) {
  return tar.list(tarball)
    .then(entries => {
      entries.sort()
      return entries
    })
} // countEntries
