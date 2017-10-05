const fs = require('fs')
const path = require('path')
const targz = require('tar.gz')
const rimraf = require('rimraf')
const createManifest = require('./create_manifest.js')

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
    logger(`... ${tarball}`)
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

async function buildBundle (searchRoot, packages, tarballs, bundleName = 'bundle', logger = () => {}) {
  const workDir = `bundle-${Date.now()}`
  const wd = process.cwd()
  process.chdir(searchRoot)

  logger('Building bundle ...')
  fs.mkdirSync(workDir)
  const bundle = path.join(workDir, 'bundle')
  fs.mkdirSync(bundle)

  await sprayOutTarballs(bundle, tarballs, logger)

  logger('... adding manifest')
  generateManifest(bundle, packages)

  logger('Creating tarball ...')
  const tgzName = path.join(searchRoot, `${bundleName}.tgz`)
  await createBundle(bundle, tgzName)
  const count = await countEntries(tgzName)
  logger(`... bundle.tgz containing ${count} files`)

  cleanUp(workDir)

  process.chdir(wd)
  return count
} // buildBundle

module.exports = buildBundle
