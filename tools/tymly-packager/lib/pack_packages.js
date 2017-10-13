const path = require('path')
const rimraf = require('rimraf')
const fs = require('fs')
const targz = require('tar.gz')
const cp = require('child_process')

function exec (cmd) {
  return cp.execSync(cmd).toString()
} // exec

async function packing (tgzName, logger) {
  logger(`... packing`)
  exec('npm pack')

  if (!fs.existsSync(tgzName)) { throw new Error(`Did not find ${tgzName}`) }

  return repack(tgzName, logger)
} // packing

async function repack (tgzName, logger) {
  logger(`... repacking`)
  await targz().extract(tgzName, '.')

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
