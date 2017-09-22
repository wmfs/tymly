'use strict'

const fs = require('fs')
const async = require('async')
const path = require('path')
const getColumnNames = require('./get-column-names')
const upath = require('upath')
const debug = require('debug')('supercopy')

module.exports = function (options, callback) {
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

  fs.readdir(rootDir, function (err, items) {
    if (err) {
      callback(err)
    } else {
      debug(`Directory contents [${items}]`)
      async.eachSeries(
        items,
        function (item, cb) {
          const dirPath = path.join(rootDir, item)
          fs.lstat(
            dirPath,
            function (err, stats) {
              if (err) {
                cb(err)
              } else {
                if (stats.isDirectory()) {
                  debug(`+ ./${item}:`)
                  const action = {}
                  info[item] = action
                  fs.readdir(dirPath, function (err, actionItems) {
                    if (err) {
                      cb()
                    } else {
                      async.eachSeries(
                        actionItems,
                        function (actionItem, cb2) {
                          const filePath = path.join(dirPath, actionItem)
                          console.log(filePath)
                          fs.lstat(
                            filePath,
                            function (err, fileStats) {
                              debug(`+   ./${actionItem}`)
                              if (err) {
                                cb2(err)
                              } else {
                                if (fileStats.isFile() && fileStats.size > 0) {
                                  getColumnNames(
                                    filePath,
                                    options,
                                    function (err, columnNames) {
                                      if (err) {
                                        cb2(err)
                                      } else {
                                        action[upath.normalize(filePath)] = {
                                          tableName: path.basename(actionItem, path.extname(actionItem)),
                                          columnNames: columnNames,
                                          size: fileStats.size
                                        }
                                        cb2()
                                      }
                                    }
                                  )
                                } else {
                                  cb2()
                                }
                              }
                            }
                          )
                        },
                        function (err) {
                          if (err) {
                            cb(err)
                          } else {
                            cb()
                          }
                        }
                      )
                    }
                  }
                  )
                } else {
                  cb()
                }
              }
            }
          )
        },
        function (err) {
          if (err) {
            callback(err)
          } else {
            callback(null, info)
          }
        }
      )
    }
  })
}
