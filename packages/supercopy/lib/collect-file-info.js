
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

module.exports = function (options, callback) {
  const info = {}
  const rootDir = options.sourceDir
  debug(`Staring to collect file info for ${rootDir}`)

  fs.readdir(rootDir, function (err, items) {
    if (err) {
      callback(err)
    } else {
      debug(`Directory contents [${items}]`)
      async.eachSeries(
        items,
        function (item, cb) {
          const dirPath = path.join(rootDir, item)
          lstatAsync(dirPath)
            .then(stats => {
              if (stats.isDirectory()) {
                debug(`+ ./${item}:`)
                const action = {}
                info[item] = action

                readdirAsync(dirPath)
                  .then(actionItems => {
                    async.eachSeries(
                      actionItems,
                      function (actionItem, cb2) {
                        const filePath = path.join(dirPath, actionItem)

                        lstatAsync(filePath)
                          .then(fileStats => {
                            if (!fileStats.isFile() || fileStats.size === 0)
                              return cb2();

                            columnNamesAsync(filePath, options)
                              .then(columnNames => {
                                action[upath.normalize(filePath)] = {
                                  tableName: path.basename(actionItem, path.extname(actionItem)),
                                  columnNames: columnNames,
                                  size: fileStats.size
                                }
                                cb2()
                              })
                              .catch(err => cb2(err)) // columnNamesAsync
                          })
                          .catch(err => cb2(err)) // lstatAsync
                      },
                      function (err) {
                        if (err) {
                          cb(err)
                        } else {
                          cb()
                        }
                      }
                    )
                  })
                  .catch(err => cb(err)) // readdirAsync
              } else {
                cb()
              }
            })
            .catch(err => cb(err)) // lstatAsync
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
