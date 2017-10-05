const gatherPackages = require('./gather_packages.js')
const readVersionNumbers = require('./read_version_numbers.js')
const packPackages = require('./pack_packages.js')
const buildBundle = require('./build_bundle.js')
const fs = require('fs')
const path = require('path')

function packageDetails (dir, logger) {
  logger(`Bundling ${dir} ...`)
  const packages = readVersionNumbers(dir, gatherPackages(dir))
  logger(`... found ${packages.length} packages`)
  return packages
} // packageDetails

function cleanUpTarballs (dir, tarballs) {
  tarballs.forEach(t => fs.unlinkSync(path.join(dir, t)))
} // cleanUpTarballs

async function bundleForDeploy (dir, logger = () => {}) {
  const packages = packageDetails(dir, logger)
  const tarballs = await packPackages(dir, packages, logger)
  await buildBundle(dir, packages, tarballs, logger)
  cleanUpTarballs(dir, tarballs)
} // bundleForDeploy

module.exports = bundleForDeploy
