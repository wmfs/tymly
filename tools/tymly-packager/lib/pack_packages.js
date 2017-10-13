const cp = require('child_process')
const path = require('path')
const rimraf = require('rimraf')
const fs = require('fs')
const targz = require('tar.gz')
const copydir = require('copy-dir')
const lerna = require('lerna')

function exec (cmd) {
  return cp.execSync(cmd).toString()
} // exec

function rewritePackageJson (packages) {
  for (const pkg of packages) {
    const packageFile = path.join(pkg.directory, 'package.json')
    const backupPackageFile = `${packageFile}.tymly-packager`

    const rawContents = fs.readFileSync(packageFile)
    const packageJson = JSON.parse(rawContents)
    delete packageJson.devDependencies

    fs.writeFileSync(backupPackageFile, rawContents)
    fs.writeFileSync(packageFile, JSON.stringify(packageJson, null, 2))
  } // for ...
} // rewritePackageJson

function restorePackageJson (packages) {
  for (const pkg of packages) {
    const packageFile = path.join(pkg.directory, 'package.json')
    const backupPackageFile = `${packageFile}.tymly-packager`

    fs.unlinkSync(packageFile)
    fs.renameSync(backupPackageFile, packageFile)
  } // for ...
} // restorePackageJson

async function prepareTree (searchTree, packages) {
  const wd = process.cwd()
  process.chdir(searchTree)

  rewritePackageJson(packages)

  const littleLerna = {
    "lerna": "2.0.0",
    "packages": packages.map(p => p.directory),
    "version": "independent",
  }
  fs.writeFileSync('lerna.json', JSON.stringify(littleLerna, null, 2))

  const needsPackageJson = !fs.existsSync('package.json')
  if (needsPackageJson) {
    fs.writeFileSync('package.json', '{ "name": "dummy" }')
  }

  exec('lerna clean --yes')
  exec('lerna bootstrap')

  fs.unlinkSync('lerna.json')
  if (needsPackageJson) {
    fs.unlinkSync('package.json')
  }

  restorePackageJson(packages)

  process.chdir(wd)
} // prepareTree

async function packing (tgzName, logger) {
  logger(`... packing`)
  exec('npm pack')

  if (!fs.existsSync(tgzName)) { throw new Error(`Did not find ${tgzName}`) }

  return repack(tgzName, logger)
} // packing

async function repack (tgzName, logger) {
  logger(`... repacking`)
  await targz().extract(tgzName, '.')

  if (fs.existsSync('node_modules')) {
    copydir.sync('node_modules', 'package/node_modules')
  } // if ...

  const basename = path.basename(process.cwd())
  fs.renameSync('package', basename)
  fs.unlinkSync(tgzName)

  await targz().compress(basename, tgzName)
  rimraf.sync(basename)

  return tgzName
} // repackWithNodeModules

async function packPackage (directory, tgzName, logger) {
  const wd = process.cwd()
  process.chdir(directory)

  const tarball = await packing(tgzName, logger)

  process.chdir(wd)

  return tarball
} // packPackage

async function packPackages (searchRoot, packages, logger = () => {}) {
  await prepareTree(searchRoot, packages)

  const tarballs = [ ]

  for (const pkg of packages) {
    logger(`Package ${pkg.name}`)
    const tgzName = `${pkg.name}-${pkg.version}.tgz`
    const dir = pkg.directory

    const tarball = await packPackage(path.join(searchRoot, dir), tgzName, logger)

    tarballs.push(path.join(dir, tarball))
  } // for ...

  return tarballs
} // packPackages

module.exports = packPackages
