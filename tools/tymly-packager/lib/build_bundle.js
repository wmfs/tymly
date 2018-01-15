const fs = require('fs')
const path = require('path')
const tar = require('./tar_helpers')
const rimraf = require('rimraf')
const cp = require('child_process')
const createManifest = require('./create_manifest.js')
const lernapath = path.resolve(__dirname, '..', 'node_modules', '.bin', 'lerna')

function exec (cmd) {
  return cp.execSync(cmd).toString()
} // exec

function lerna (cmd, ...params) {
  exec(`${lernapath} ${cmd} --loglevel silent ${params.join(' ')}`)
} // lerna

function stripDevDepsFromPackageJson (packages) {
  for (const pkg of packages) {
    const packageFile = path.join(pkg.directory, 'package.json')
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
    const packageFile = path.join(pkg.directory, 'package.json')
    const packageLockFile = path.join(pkg.directory, 'package-lock.json')
    const backupPackageFile = `${packageFile}.tymly-packager`

    fs.unlinkSync(packageFile)
    fs.renameSync(backupPackageFile, packageFile)
    if (fs.existsSync(packageLockFile)) {
      fs.unlinkSync(packageLockFile)
    }
  } // for ...
} // restorePackageJson

function lernaJsonStubs () {
  const littleLerna = {
    'lerna': '2.0.0',
    'packages': [
      'packages/*',
      'plugins/*',
      'blueprints/*'
    ],
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

async function countEntries (tarball) {
  const entries = await tar.list(tarball)
  return entries.length
} // countEntries

async function sprayOutTarballs (bundle, packages, logger) {
  for (const pkg of packages) {
    logger(`... ${path.basename(pkg.tarball, '.tgz')}`)
    await tar.extract(pkg.tarball, path.join(bundle, pkg.directory))
  }
} // sprayOutTarballs

function generateManifest (bundle, packages) {
  const manifest = createManifest(packages)
  fs.writeFileSync(path.join(bundle, 'manifest.json'), JSON.stringify(manifest, null, 2))
}  // generateManifest

async function createBundle (bundle, tgzName) {
  const wd = process.cwd()
  process.chdir(path.join(bundle, '..'))

  await tar.create(path.basename(bundle), tgzName)

  process.chdir(wd)
} // createBundle

function cleanUp (bundle) {
  // sometimes chokes on Windows so retry
  for (let i = 0; i !== 20; ++i) {
    try {
      rimraf.sync(bundle)
    } catch (err) {
    }
  }
} // cleanUp

async function buildBundle (searchRoot, workDirRoot, packages, bundleName = 'bundle.tgz', logger = () => {}) {
  const workDir = `${workDirRoot}/bundle-${Date.now()}`
  const wd = process.cwd()
  process.chdir(searchRoot)

  logger('Populating bundle ...')
  if (!fs.existsSync(workDirRoot)) {
    fs.mkdirSync(workDirRoot)
  }
  fs.mkdirSync(workDir)

  const bundle = path.join(workDir, 'tymly')
  fs.mkdirSync(bundle)

  await sprayOutTarballs(bundle, packages, logger)

  logger('... populating node_modules')
  populateNodeModules(bundle, packages)

  logger('... adding manifest')
  generateManifest(bundle, packages)

  logger('Creating tarball ...')
  const tgzName = path.resolve(searchRoot, bundleName)
  await createBundle(bundle, tgzName)
  const count = await countEntries(tgzName)
  logger(`... ${path.basename(bundleName)} containing ${count} files`)

  cleanUp(workDir)

  process.chdir(wd)
  return [tgzName, count]
} // buildBundle

module.exports = buildBundle
