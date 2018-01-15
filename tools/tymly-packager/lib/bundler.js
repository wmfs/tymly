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

function cleanUpTarballs (dir, packages) {
  packages.forEach(pkg => fs.unlinkSync(path.join(dir, pkg.tarball)))
} // cleanUpTarballs

async function bundleForDeploy (dir, workDir, bundleName = 'bundle', logger = () => {}) {
  const absoluteDir = path.resolve(dir)
  const packages = packageDetails(dir, absoluteDir, logger)
  const packagesWithTarballs = await packPackages(absoluteDir, packages, logger)
  const [tgzName] = await buildBundle(absoluteDir, workDir, packagesWithTarballs, bundleName, logger)
  cleanUpTarballs(absoluteDir, packagesWithTarballs)
  return tgzName
} // bundleForDeploy

module.exports = bundleForDeploy
