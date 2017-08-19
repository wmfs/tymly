'use strict'

const debug = require('debug')('smithereens')
const UNKNOWN_FILENAME = 'unknown'
const UNKNOWN_DIR = 'unknown'
const path = require('path')
const makeDir = require('make-dir')
const fs = require('fs')
const csvStringify = require('csv-string').stringify
const Transformer = require('./Transformer')
const upath = require('upath')
const _ = require('lodash')

class FileBuilder {
  constructor (options) {
    const _this = this
    this.started = new Date()
    this.files = {}

    this.knownDirs = []
    this.outputDirRootPath = options.outputDirRootPath

    this.dirSplits = []
    if (options.hasOwnProperty('dirSplits')) {
      options.dirSplits.forEach(
        function (dirSplit) {
          // Is this a columnIndex-based split?
          if (_.isObject(dirSplit) && dirSplit.hasOwnProperty('columnIndex')) {
            _this.dirSplits.push(FileBuilder.getColumnIndexDirSplit(dirSplit.columnIndex, dirSplit.valueToDirMap || {}))
          }
        }
      )
    }
    this.hasDirSplits = this.dirSplits.length > 0

    if (options.fileSplits.hasOwnProperty('columnIndex')) {
      this.getFileConfigFromCsvLine = FileBuilder.getColumnIndexFileConfigFunction(options.fileSplits.columnIndex, options.fileSplits.valueToFileMap)
    }
  }

  static getColumnIndexDirSplit (columnIndex, valueToDirMap) {
    return function columnIndexDirSplit (line) {
      let value = line[columnIndex]
      if (valueToDirMap.hasOwnProperty(value)) {
        value = valueToDirMap[value]
      } else {
        value = UNKNOWN_DIR
      }
      return value
    }
  }

  static getColumnIndexFileConfigFunction (columnIndex, valueToFileMap) {
    return function columnIndexFileInfo (line) {
      let value = line[columnIndex]
      let keys = _.keys(valueToFileMap)
      let matchingKey

      for (let key of keys) {
        let splitKeys = key.split('&')
        for (let k of splitKeys) {
          if (k === value) {
            matchingKey = key
          }
        }
      }
      if (valueToFileMap.hasOwnProperty(matchingKey)) {
        value = valueToFileMap[matchingKey]
      } else {
        value = {filename: UNKNOWN_FILENAME}
      }
      return value
    }
  }

  getDirPathFromCsvLine (incomingCsvLine) {
    let dirPath = '.'
    if (this.hasDirSplits) {
      const dirParts = []
      this.dirSplits.forEach(
        function (dirSplitFunction) {
          dirParts.push(dirSplitFunction(incomingCsvLine))
        }
      )
      dirPath += '/' + dirParts.join('/')
    }
    return dirPath
  }

  getWriteStreamInfo (incomingCsvLine, callback) {
    const _this = this
    const dirPath = this.getDirPathFromCsvLine(incomingCsvLine)
    const fileConfig = this.getFileConfigFromCsvLine(incomingCsvLine)
    const key = dirPath + '/' + fileConfig.filename + '.csv'

    function createWriteStream () {
      const writeStream = fs.createWriteStream(path.resolve(_this.outputDirRootPath, key))
      const info = {
        writeStream: writeStream,
        transformer: new Transformer(fileConfig),
        dirPath: dirPath,
        filename: fileConfig.filename,
        count: 0
      }
      _this.files[key] = info
      const header = _.map(fileConfig.outputColumns, 'name')
      if (header.length > 0) {
        writeStream.write(csvStringify(header), function (err) {
          if (err) {
            callback(err)
          } else {
            debug(`Created writeStream '${key}' (${JSON.stringify(fileConfig)})`)
            callback(null, info)
          }
        })
      } else {
        callback(null, info)
      }
    }

    if (this.files.hasOwnProperty(key)) {
      callback(null, this.files[key])
    } else {
      if (this.knownDirs.indexOf(dirPath) === -1) {
        // TODO: Good form to call callbacks inside promises?
        makeDir(path.resolve(this.outputDirRootPath, dirPath)).then(
          function () {
            _this.knownDirs.push(dirPath)
            createWriteStream()
          }
        ).catch(
          function (err) {
            callback(err)
          }
        )
      } else {
        createWriteStream()
      }
    }
  }

  close () {
    _.forEach(
      this.files,
      function (file) {
        file.writeStream.close()
      }
    )
  }

  getManifest () {
    const manifest = {
      outputDirRootPath: this.outputDirRootPath,
      started: this.started,
      finished: new Date(),
      filenamePaths: {},
      counts: {
        totalFileCount: 0,
        totalLineCount: 0,
        byFilename: {},
        byDir: {},
        byFile: {}
      }
    }

    const filenamePaths = manifest.filenamePaths
    const counts = manifest.counts
    const byFilename = counts.byFilename
    const byDir = counts.byDir

    _.forOwn(
      this.files,
      function (file) {
        counts.totalFileCount += 1
        counts.totalLineCount += file.count

        if (!byFilename.hasOwnProperty(file.filename)) {
          byFilename[file.filename] = 0
        }
        byFilename[file.filename] += file.count
        const baseName = path.basename(file.dirPath)
        if (!byDir.hasOwnProperty(baseName)) {
          byDir[baseName] = 0
        }
        byDir[baseName] += file.count

        const fullFilename = upath.join(file.dirPath, file.filename + '.csv')
        manifest.counts.byFile[fullFilename] = file.count

        if (!filenamePaths.hasOwnProperty(file.filename)) {
          filenamePaths[file.filename] = []
        }
        filenamePaths[file.filename].push(fullFilename)
      }
    )

    return manifest
  }
}

module.exports = FileBuilder
