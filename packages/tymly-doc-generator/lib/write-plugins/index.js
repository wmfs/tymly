'use strict'

const fs = require('fs')
const path = require('upath')
const ejs = require('ejs')
const _ = require('lodash')
const shortenPluginName = require('./../write-reference/utils/shorten-plugin-name')

const configTemplate = fs.readFileSync(path.resolve(__dirname, './templates/plugin.ejs'))

module.exports = function (rootDir, inventory) {
  _.forEach(
    inventory.plugins,
    function (plugin) {
      const ctx = {
        _: _,
        pluginName: plugin.package.pkg.name,
        meta: plugin.meta,
        plugin: plugin,
        package: plugin.package.pkg
      }

      ctx.pluginShortName = shortenPluginName(ctx.pluginName)

      const pluginMd = ejs.render(
        configTemplate.toString(),
        ctx
      )

      const destination = path.resolve(__dirname, `./../../hugo-site/content/plugins/${ctx.pluginName}.md`)
      console.log('Writing ' + destination)
      fs.writeFileSync(destination, pluginMd)
    }
  )

  // const tymlyPackagePath = path.resolve(require.resolve('tymly'), './../../package.json')
  // const ctx = {
  //   tymlyPackage: require(tymlyPackagePath)
  // }
  //
  // const toml = ejs.render(
  //   configTemplate.toString(),
  //   ctx
  // )
  //
  // const destination = path.resolve(__dirname, './../../hugo-site/config.toml')
  // console.log('Writing ' + destination)
  // fs.writeFileSync(destination, toml)
}
