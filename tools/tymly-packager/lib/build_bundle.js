const fs = require('fs')
const path = require('path')
const targz = require('tar.gz')
const rimraf = require('rimraf')
const cp = require('child_process')
const createManifest = require('./create_manifest.js')

function exec (cmd) {
  return cp.execSync(cmd).toString()
} // exec

function lerna (cmd, ...params) {
  exec(`lerna ${cmd} --loglevel silent ${params.join(' ')}`)
} // lerna

function stripDevDepsFromPackageJson (packages) {
  for (const pkg of packages) {
    const packageFile = path.join(pkg.basename, 'package.json')
    const backupPackageFile = `${packageFile}.tymly-packager`

    const rawContents = fs.readFileSync(packageFile)
    const packageJson = JSON.parse(rawContents)
    delete packageJson.devDependencies

    fs.writeFileSync(backupPackageFile, rawContents)
    fs.writeFileSync(packageFile, JSON.stringify(packageJson, null, 2))
  } // for ...
} // stripDevDepsFromPackageJson

function restorePackageJson (packages) {
  for (const pkg of packages) {
    const packageFile = path.join(pkg.basename, 'package.json')
    const packageLockFile = path.join(pkg.basename, 'package-lock.json')
    const backupPackageFile = `${packageFile}.tymly-packager`

    fs.unlinkSync(packageFile)
    fs.renameSync(backupPackageFile, packageFile)
    if (fs.existsSync(packageLockFile)) {
      fs.unlinkSync(packageLockFile)
    }
  } // for ...
} // restorePackageJson

function lernaJsonStubs (packages) {
  const littleLerna = {
    'lerna': '2.0.0',
    'packages': packages.map(p => p.basename),
    'version': 'independent'
  }
  fs.writeFileSync('lerna.json', JSON.stringify(littleLerna, null, 2))
  fs.writeFileSync('package.json', '{ "name": "dummy" }')
} // lernaJsonStubs

function cleanUpLernaStubs () {
  fs.unlinkSync('lerna.json')
  fs.unlinkSync('package.json')
} // cleanUpLernaStubs

function populateNodeModules (searchTree, packages) {
  const wd = process.cwd()
  process.chdir(searchTree)

  stripDevDepsFromPackageJson(packages)
  lernaJsonStubs(packages)

  lerna('clean', '--yes')
  lerna('bootstrap')

  cleanUpLernaStubs()
  restorePackageJson(packages)

  process.chdir(wd)
} // populateNodeModules

function countEntries (tarball) {
  return new Promise((resolve) => {
    const read = fs.createReadStream(tarball)
    const parse = targz().createParseStream()
    let count = 0

    parse.on('entry', entry => {
      count += (entry.type === 'File')
    })
    parse.on('end', () => {
      resolve(count)
    })

    read.pipe(parse)
  })
} // countEntries

async function sprayOutTarballs (bundle, tarballs, logger) {
  for (const tarball of tarballs) {
    logger(`... ${path.basename(tarball, '.tgz')}`)
    await targz().extract(tarball, bundle)
  }
} // sprayOutTarballs

function generateManifest (bundle, packages) {
  const manifest = createManifest(packages)
  fs.writeFileSync(path.join(bundle, 'manifest.json'), JSON.stringify(manifest, null, 2))
}  // generateManifest

async function createBundle (bundle, tgzName) {
  const wd = process.cwd()
  process.chdir(bundle)

  await targz().compress('.', tgzName)

  process.chdir(wd)
} // createBundle

function cleanUp (bundle) {
  rimraf.sync(bundle)
} // cleanUp

async function buildBundle (searchRoot, packages, tarballs, bundleName = 'bundle.tgz', logger = () => {}) {
  const workDir = `bundle-${Date.now()}`
  const wd = process.cwd()
  process.chdir(searchRoot)

  logger('Populating bundle ...')
  fs.mkdirSync(workDir)
  const bundle = path.join(workDir, 'bundle')
  fs.mkdirSync(bundle)

  await sprayOutTarballs(bundle, tarballs, logger)

  logger('... populating node_modules')
  populateNodeModules(bundle, packages)

  logger('... adding manifest')
  generateManifest(bundle, packages)

  logger('Creating tarball ...')
  const tgzName = path.resolve(searchRoot, `${bundleName}`)
  await createBundle(bundle, tgzName)
  const count = await countEntries(tgzName)
  logger(`... ${bundleName} containing ${count} files`)

  cleanUp(workDir)

  process.chdir(wd)
  return [tgzName, count]
} // buildBundle

module.exports = buildBundle
