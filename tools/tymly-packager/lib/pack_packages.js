const cp = require('child_process')
const path = require('path')
const rimraf = require('rimraf')
const fs = require('fs')
const targz = require('tar.gz')
const copydir = require('copy-dir')

function exec (cmd) {
  return cp.execSync(cmd).toString()
} // exec

function removeExistingTgz (tgzName) {
  if (!fs.existsSync(tgzName)) { return }

  console.log(`... removing ${tgzName}`)
  fs.unlinkSync(tgzName)
} // removeExistingTgz

function cleanAndRefreshNodeModules () {
  rimraf.sync('node_modules')
  console.log(`... fetching production dependencies`)
  exec('npm install --production --no-optional')
} // cleanAndRefreshNodeModules

async function packing (tgzName) {
  console.log(`... packing`)
  exec('npm pack')

  if (!fs.existsSync(tgzName)) { throw new Error(`Did not find ${tgzName}`) }

  return repack(tgzName)
} // packing

async function repack (tgzName) {
  console.log(`... repacking`)
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

async function packPackage (directory, tgzName) {
  const wd = process.cwd()
  process.chdir(directory)

  removeExistingTgz(tgzName)

  cleanAndRefreshNodeModules()

  const tarball = await packing(tgzName)

  process.chdir(wd)

  return tarball
} // packPackage

async function packPackages (searchRoot, packages) {
  const tarballs = [ ]

  for (const pkg of packages) {
    console.log(`Module ${pkg.name}`)
    const tgzName = `${pkg.name}-${pkg.version}.tgz`
    const dir = pkg.directory

    const tarball = await packPackage(path.join(searchRoot, dir), tgzName)

    tarballs.push(path.join(dir, tarball))
  } // for ...

  return tarballs
} // packPackages

module.exports = packPackages
