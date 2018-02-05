const fs = require('fs')
const path = require('path')

function gatherPackages (searchRoot, exclusions) {
  const searchDir = path.normalize(searchRoot)

  const directories = searchTymlyDirectories(searchDir, exclusions)
  const packages = directories
    .map(dir => [ path.relative(searchDir, dir), path.basename(dir) ])
    .map(([dir, base]) => [ dir || '.', base ])
    .map(([dir, base]) => { return { directory: dir, basename: base } })
  return packages
} // gatherPackages

function searchTymlyDirectories (searchDir, exclusions) {
  const directories = []
  for (const subType of ['packages', 'plugins', 'blueprints']) {
    const subDir = path.resolve(searchDir, subType)
    if (!fs.existsSync(subDir)) {
      continue
    }
    const contents = searchTypeDirectory(subDir, exclusions)
    directories.push(...contents)
  }
  return directories
} // searchTymlyDirectories

function searchTypeDirectory (directory, exclusions) {
  const directories = []

  for (const candidate of fs.readdirSync(directory)) {
    if ((candidate === 'node_modules') ||
      (candidate === 'test') ||
      (candidate.startsWith('.'))) {
      continue
    }

    const fullPath = path.resolve(directory, candidate)
    const stats = fs.statSync(fullPath)
    if (!stats.isDirectory()) {
      continue
    }

    const packageJson = path.resolve(fullPath, 'package.json')
    if (!fs.existsSync(packageJson)) {
      continue
    }

    if (exclusions.includes(candidate)) {
      continue
    }

    // it's a winner!
    directories.push(fullPath)
  } // for ...

  return directories
} // searchDirectories

module.exports = gatherPackages
