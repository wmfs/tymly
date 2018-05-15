'use strict'

const exec = require('child_process').exec
const sprintf = require('sprintf')
const path = require('upath')
const tymly = require('tymly')

const writeConfig = require('./write-config')
const writeKeyConcepts = require('./write-key-concepts')
const writeReference = require('./write-reference')
const writePlugins = require('./write-plugins')
const writeGettingStarted = require('./write-getting-started')

class DocGenerator {
  constructor (options) {
    this.options = options

    // Add Tymly's own internal plugin to the paths
    // ---------------------------------------------
    let tymlyDir = require.resolve('tymly')
    tymlyDir = path.dirname(tymlyDir)
    this.messages = require(path.resolve(tymlyDir, 'startup-messages'))()
    tymlyDir = path.resolve(tymlyDir, './plugin')
    this.options.pluginPaths.unshift(tymlyDir)

    console.log('\n\nTYMLY DOCUMENTATION GENERATOR')
    console.log('------------------------------')
    console.log('destination: ' + options.destination)
    console.log('pluginPaths: ' + options.pluginPaths)
    console.log('blueprintPaths: ' + options.blueprintPaths)
  }

  addDynamicContent (callback) {
    tymly.boot({}, (err, tymlyServices) => {
      if (err) {
        callback(err)
      } else {
        tymlyServices.inventory.collateEverything(
          {
            pluginPaths: this.options.pluginPaths,
            blueprintPaths: this.options.blueprintPaths,
            messages: this.messages
          }, (err, inventory) => {
            if (err) {
              callback(err)
            } else {
              writeConfig(this.options.destination, inventory)
              writePlugins(this.options.destination, inventory)
              writeKeyConcepts(this.options.destination, inventory)
              writeReference(this.options.destination,
                inventory,
                (err) => {
                  if (err) {
                    console.error(err)
                  } else {
                    writeGettingStarted(this.options.destination, inventory, callback)
                  }
                }
              )
            }
          }
        )
      }
    })
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
