
const fs = require('fs')
const async = require('async')
const path = require('path')
const getColumnNames = require('./get-column-names')
const upath = require('upath')
const debug = require('debug')('supercopy')
const promisify = require('util').promisify

const readdirAsync = promisify(fs.readdir)
const lstatAsync = promisify(fs.lstat)
const columnNamesAsync = promisify(getColumnNames)

module.exports = function(options, callback) {
  collect(options)
    .then(info => callback(null, info))
    .catch(err => callback(err, null))
}

async function collect(options) {
  const rootDir = options.sourceDir
  debug(`Staring to collect file info for ${rootDir}`)

  const info = { }
  const dirs = await directoriesUnder(rootDir)
  for (const dirPath of dirs) {
    debug(`+ ./${path.basename(dirPath)}:`)

    const action = { }
    info[path.basename(dirPath)] = action

    for (const [filePath, size] of await filesUnder(dirPath)) {
      debug(`+   ./${path.basename(filePath)}:`)

      const columnNames = await columnNamesAsync(filePath, options);
      action[upath.normalize(filePath)] = {
        tableName: path.basename(filePath, path.extname(filePath)),
        columnNames: columnNames,
        size: size
      }
    } // for ...
  } // for ...

  return info
} // collect

async function directoriesUnder(rootDir) {
  const items = await readdirAsync(rootDir)
  debug(`Directory contents [${items}]`)
  const statedItems = await Promise.all(
    items.map(async item => {
      const dirPath = path.join(rootDir, item)
      const stats = await lstatAsync(dirPath)
      return stats.isDirectory() ? dirPath : null
    })
  )
  const dirs = statedItems.filter(d => !!d)
  return dirs
} // directoriesUnder

async function filesUnder(rootDir) {
  const items = await readdirAsync(rootDir)
  const statedItems = await Promise.all(
    items.map(async item => {
      const filePath = path.join(rootDir, item)
      const stats = await lstatAsync(filePath)
      return (stats.isFile() && stats.size !== 0) ?
        [filePath, stats.size] : null
    })
  )
  const files = statedItems.filter(f => !!f)
  return files
} // filesUnder
