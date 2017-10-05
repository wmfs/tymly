const gatherPackages = require('./gather_packages.js')
const readVersionNumbers = require('./read_version_numbers.js')
const packPackages = require('./pack_packages.js')
const buildBundle = require('./build_bundle.js')
const fs = require('fs')
const path = require('path')

function packageDetails (dir) {
  console.log(`Bundling ${dir} ...`)
  const packages = readVersionNumbers(dir, gatherPackages(dir))
  console.log(`... found ${packages.length} packages`)
  return packages
} // packageDetails

function cleanUpTarballs (dir, tarballs) {
  tarballs.forEach(t => fs.unlinkSync(path.join(dir, t)))
} // cleanUpTarballs

async function bundleForDeploy (dir) {
  const packages = packageDetails(dir)
  const tarballs = await packPackages(dir, packages)
  await buildBundle(dir, packages, tarballs)
  cleanUpTarballs(dir, tarballs)
} // bundleForDeploy

module.exports = bundleForDeploy
