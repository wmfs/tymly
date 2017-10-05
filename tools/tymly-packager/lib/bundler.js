const gatherPackages = require('./gather_packages.js')
const readVersionNumbers = require('./read_version_numbers.js')
const packPackages = require('./pack_packages.js')
const buildBundle = require('./build_bundle.js')
const fs = require('fs')
const path = require('path')

function packageDetails (dir, absoluteDir, logger) {
  logger(`Bundling ${dir} ...`)
  const packages = readVersionNumbers(absoluteDir, gatherPackages(dir))
  logger(`... found ${packages.length} packages`)
  return packages
} // packageDetails

function cleanUpTarballs (dir, tarballs) {
  tarballs.forEach(t => fs.unlinkSync(path.join(dir, t)))
} // cleanUpTarballs

async function bundleForDeploy (dir, bundleName = 'bundle', logger = () => {}) {
  const absoluteDir = path.resolve(dir)
  const packages = packageDetails(dir, absoluteDir, logger)
  const tarballs = await packPackages(absoluteDir, packages, logger)
  await buildBundle(absoluteDir, packages, tarballs, bundleName, logger)
  cleanUpTarballs(absoluteDir, tarballs)
} // bundleForDeploy

module.exports = bundleForDeploy
