'use strict'

const exec = require('child_process').exec
const sprintf = require('sprintf')
const path = require('upath')
const tymly = require('tymly')

const writeConfig = require('./write-config')
const writeKeyConcepts = require('./write-key-concepts')
const writeCoreComponents = require('./write-core-components')
const writeGettingStarted = require('./write-getting-started')

class DocGenerator {
  constructor (options) {
    this.options = options

    // Add Tymly's own internal plugin to the paths
    // ---------------------------------------------
    let tymlyDir = require.resolve('tymly')
    tymlyDir = path.dirname(tymlyDir)
    tymlyDir = path.resolve(tymlyDir, './plugin')
    this.options.pluginPaths.unshift(tymlyDir)

    console.log('\n\nTYMLY DOCUMENTATION GENERATOR')
    console.log('------------------------------')
    console.log('destination: ' + options.destination)
    console.log('pluginPaths: ' + options.pluginPaths)
    console.log('blueprintPaths: ' + options.blueprintPaths)
  }

  addDynamicContent (callback) {
    const _this = this
    tymly.boot(
      {},
      function (err, tymlyServices) {
        if (err) {
          callback(err)
        } else {
          tymlyServices.inventory.collateEverything(
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
                writeCoreComponents(_this.options.destination,
                  inventory,
                  function (err) {
                    if (err) {
                      console.error(err)
                    } else {
                      writeGettingStarted(_this.options.destination, inventory, callback)
                    }
                  }
                )
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
