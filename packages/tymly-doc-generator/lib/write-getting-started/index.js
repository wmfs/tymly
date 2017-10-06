'use strict'

const fs = require('fs')
const path = require('upath')
const ejs = require('ejs')
const checkNodeVersion = require('check-node-version')

const configTemplate = fs.readFileSync(path.resolve(__dirname, './templates/getting-started.ejs'))

module.exports = function (rootDir, inventory, callback) {
  checkNodeVersion(
    function (err, nodeInfo) {
      if (err) {
        callback(err)
      } else {
        const tymlyPackagePath = path.resolve(require.resolve('tymly'), './../../package.json')
        const ctx = {
          tymlyPackage: require(tymlyPackagePath),
          nodeInfo: nodeInfo
        }
        const gettingStarted = ejs.render(
          configTemplate.toString(),
          ctx
        )
        const destination = path.resolve(__dirname, './../../hugo-site/content/getting-started/index.md')
        console.log('Writing ' + destination)
        fs.writeFileSync(destination, gettingStarted)
        callback(null)
      }
    }
  )
}
