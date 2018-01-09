const path = require('path')
const rimraf = require('rimraf')
const fs = require('fs')
const cp = require('child_process')
const tar = require('./tar_helpers')

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
  logger('... repacking')
  await tar.extract(tgzName)
  fs.unlinkSync(tgzName)

  const wd = process.cwd()
  process.chdir('package')
  await tar.create('.', path.join('..', tgzName))

  process.chdir(wd)
  forceDelete('package')

  return tgzName
} // repackWithNodeModules

async function packPackage (directory, tgzName, logger) {
  const wd = process.cwd()
  process.chdir(directory)

  const tarball = await packing(tgzName, logger)

  process.chdir(wd)

  return tarball
} // packPackage

function fancyType (directory) {
  const t = directory.substring(0, directory.indexOf('s'))
  return `${t.charAt(0).toUpperCase()}${t.substring(1)}`
}

async function packPackages (searchRoot, packages, logger = () => {}) {
  const results = []

  for (const pkg of packages) {
    logger(`${fancyType(pkg.directory)} ${pkg.name}`)
    const tgzName = `${pkg.name}-${pkg.version}.tgz`
    const dir = pkg.directory

    const tarball = await packPackage(path.join(searchRoot, dir), tgzName, logger)

    const upkg = Object.assign({}, pkg)
    upkg.tarball = path.join(dir, tarball)
    results.push(upkg)
  } // for ...

  return results
} // packPackages


function forceDelete(dir) {
  // sometimes chokes on Windows so retry
  for (let i = 0; i != 2; ++i) {
    try {
      rimraf.sync(dir)
    }
    catch (err) {
      console.log(`   couldn't delete ${dir} `)
      if (i == 0)
        console.log('   retrying ...')
    }
  }
}

module.exports = packPackages
