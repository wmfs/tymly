'use strict'

const exec = require('child_process').exec
const sprintf = require('sprintf')
const path = require('upath')
const flobot = require('flobot')

const writeConfig = require('./write-config')
const writeKeyConcepts = require('./write-key-concepts')
const writeCoreComponents = require('./write-core-components')

class DocGenerator {
  constructor (options) {
    this.options = options

    // Add Flobot's own internal plugin to the paths
    // ---------------------------------------------
    let flobotDir = require.resolve('flobot')
    flobotDir = path.dirname(flobotDir)
    flobotDir = path.resolve(flobotDir, './plugin')
    this.options.pluginPaths.unshift(flobotDir)

    console.log('\n\nFLOBOT DOCUMENTATION GENERATOR')
    console.log('------------------------------')
    console.log('destination: ' + options.destination)
    console.log('pluginPaths: ' + options.pluginPaths)
    console.log('blueprintPaths: ' + options.blueprintPaths)
  }

  addDynamicContent (callback) {
    const _this = this
    flobot.boot(
      {},
      function (err, flobotServices) {
        if (err) {
          callback(err)
        } else {
          flobotServices.inventory.collateEverything(
            {
              pluginPaths: _this.options.pluginPaths,
              blueprintPaths: _this.options.blueprintPaths
            },
            function (err, inventory) {
              if (err) {
                callback(err)
              } else {
                writeConfig(_this.options.destination, inventory)
                writeKeyConcepts(_this.options.destination, inventory)
                writeCoreComponents(_this.options.destination, inventory, callback)
              }
            }
          )
        }
      }
    )
  }

  runHugo (callback) {
    const cmd = sprintf(
      'hugo -d "%s"',
      this.options.destination
    )

    console.log('Hugo cmd: ' + cmd)

    exec(
      cmd,
      {
        cwd: path.resolve(__dirname, './../hugo-site')
      },
      callback
    )
  }
}

module.exports = DocGenerator
