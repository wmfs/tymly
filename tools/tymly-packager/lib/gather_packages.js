const fs = require('fs')
const path = require('path')

function searchDirectories (directory) {
  const directories = []

  for (const candidate of fs.readdirSync(directory)) {
    if (candidate === 'package.json') {
      directories.push(directory)
      continue
    } // if ...

    if (candidate === 'node_modules') {
      continue
    }

    const fullPath = path.resolve(directory, candidate)
    const stats = fs.statSync(fullPath)
    if (stats.isDirectory()) {
      const subDirectories = searchDirectories(fullPath)
      directories.push(...subDirectories)
    }
  } // for ...

  return directories
} // searchDirectories

function gatherPackages (searchRoot) {
  const searchDir = path.normalize(searchRoot)

  const directories = searchDirectories(searchDir)
  const packages = directories
    .map(dir => path.relative(searchDir, dir))
    .map(dir => dir || '.')
    .map(dir => { return { directory: dir } })
  return packages
} // gatherPackages

module.exports = gatherPackages
