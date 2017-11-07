'use strict'

const fs = require('fs')
const path = require('path')
const getColumnNames = require('./get-column-names')
const upath = require('upath')
const debug = require('debug')('supercopy')
const promisify = require('util').promisify

const readdirAsync = promisify(fs.readdir)
const lstatAsync = promisify(fs.lstat)
const columnNamesAsync = promisify(getColumnNames)

module.exports = collect

async function collect (options) {
  const info = {}
  if (options.hasOwnProperty('truncateTables') && options.truncateTables === true) {
    if (options.hasOwnProperty('topDownTableOrder') && options.topDownTableOrder.length !== 0) {
      info.truncateTables = options.topDownTableOrder.slice(0) // clones array
      info.truncateTables.reverse()
      debug(info)
    } else {
      debug('WARNING: truncateTables is set to true, but topDownTableOrder has not been specified (or is empty) (so truncation will not be carried out)')
    }
  }

  const rootDir = options.sourceDir
  debug(`Starting to collect file info for ${rootDir}`)

  const dirs = await directoriesUnder(rootDir)
  for (const dirPath of dirs) {
    debug(`+ ./${path.basename(dirPath)}:`)

    const action = { }
    info[path.basename(dirPath)] = action

    for (const [filePath, size] of await filesUnder(dirPath)) {
      const fileName = path.basename(filePath)
      debug(`+   ./${fileName}:`)

      try {
        const columnNames = await columnNamesAsync(filePath, options)
        action[upath.normalize(filePath)] = {
          tableName: path.basename(filePath, path.extname(filePath)),
          columnNames: columnNames,
          size: size
        }
      } catch (err) {
        debug(`    Could not get column names for ${fileName}`)
      }
    } // for ...
  } // for ...

  return info
} // collect

function directoriesUnder (rootDir) {
  return directoryContents(
    rootDir,
    stats => stats.isDirectory(),
    (path, stats) => path
  )
} // directoriesUnder

function filesUnder (rootDir) {
  return directoryContents(
    rootDir,
    stats => (stats.isFile() && stats.size !== 0),
    (path, stats) => [path, stats.size]
  )
} // filesUnder

async function directoryContents (rootDir, filter, transform) {
  const items = await readdirAsync(rootDir)
  debug(`Directory contents [${items}]`)
  const statedItems = await Promise.all(
    items.map(async item => {
      const itemPath = path.join(rootDir, item)
      const stats = await lstatAsync(itemPath)
      return filter(stats) ? transform(itemPath, stats) : null
    })
  )
  const dirs = statedItems.filter(d => !!d)
  return dirs
} // directoryContents
